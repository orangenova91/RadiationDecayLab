"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { KOREA_ADMIN_REGIONS, type KoreaAdminRegion } from "@/lib/korea-admin-regions";
import { KOREA_SCHOOLS_BY_REGION } from "@/lib/korea-schools-by-region.generated";
import type { LabMeta } from "@/lib/lab-store";

const SCHOOL_SUGGEST_CAP = 100;

const GRADE_OPTIONS = ["1학년", "2학년", "3학년"] as const;

function isKoreaAdminRegion(value: string): value is KoreaAdminRegion {
  return (KOREA_ADMIN_REGIONS as readonly string[]).includes(value);
}

function emptyMeta(): LabMeta {
  return {
    region: "",
    schoolName: "",
    grade: "",
    classSection: "",
  };
}

type CreateLabDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (meta: LabMeta) => Promise<void>;
  loading: boolean;
  /** 서버/Firestore 실패 등 부모에서 전달하는 오류 */
  submitError?: string;
};

export function CreateLabDialog({ open, onOpenChange, onConfirm, loading, submitError }: CreateLabDialogProps) {
  const [meta, setMeta] = useState<LabMeta>(emptyMeta);
  const [formError, setFormError] = useState("");
  const [schoolSuggestOpen, setSchoolSuggestOpen] = useState(false);
  const [schoolActiveIdx, setSchoolActiveIdx] = useState(-1);
  const schoolListRef = useRef<HTMLUListElement>(null);
  const schoolWrapRef = useRef<HTMLDivElement>(null);
  const schoolListId = useId();

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/40";

  const selectClass = `${inputClass} cursor-pointer bg-white`;

  const schoolOptions = useMemo(() => {
    if (!meta.region || !isKoreaAdminRegion(meta.region)) {
      return [];
    }
    return KOREA_SCHOOLS_BY_REGION[meta.region];
  }, [meta.region]);

  const filteredSchools = useMemo(() => {
    const q = meta.schoolName.trim();
    if (!q || schoolOptions.length === 0) {
      return [];
    }
    const matches = schoolOptions.filter((name) => name.includes(q));
    return matches.slice(0, SCHOOL_SUGGEST_CAP);
  }, [meta.schoolName, schoolOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const region = meta.region.trim();
    const schoolName = meta.schoolName.trim();
    const grade = meta.grade.trim();
    const classSection = meta.classSection.trim();
    if (!region) {
      setFormError("지역을 선택해 주세요.");
      return;
    }
    if (!schoolName) {
      setFormError("학교명을 입력해 주세요.");
      return;
    }
    if (!schoolOptions.includes(schoolName)) {
      setFormError("학교명은 선택한 지역에 해당하는 학교 목록에 있는 이름과 같아야 합니다. 검색 후 목록에서 고르거나, 목록과 동일하게 입력해 주세요.");
      return;
    }
    if (!(GRADE_OPTIONS as readonly string[]).includes(grade)) {
      setFormError("참여 학년을 선택해 주세요.");
      return;
    }
    if (!classSection) {
      setFormError("학반을 입력해 주세요.");
      return;
    }
    setFormError("");
    await onConfirm({ region, schoolName, grade, classSection });
  };

  useEffect(() => {
    if (!schoolSuggestOpen) {
      return;
    }
    const onDocPointerDown = (e: PointerEvent) => {
      const el = schoolWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSchoolSuggestOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [schoolSuggestOpen]);

  useEffect(() => {
    if (schoolActiveIdx < 0 || !schoolListRef.current) {
      return;
    }
    const row = schoolListRef.current.querySelector<HTMLLIElement>(`[data-idx="${schoolActiveIdx}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [schoolActiveIdx]);

  const pickSchool = (name: string) => {
    setMeta((m) => ({ ...m, schoolName: name }));
    setSchoolSuggestOpen(false);
    setSchoolActiveIdx(-1);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg focus:outline-none"
          onPointerDownOutside={(e) => loading && e.preventDefault()}
          onEscapeKeyDown={(e) => loading && e.preventDefault()}
        >
          <Dialog.Title className="text-lg font-semibold text-zinc-900">실험실 정보</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-zinc-600">
            실험실을 만들기 전에 지역·학교·학년·학반을 입력해 주세요.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="lab-region" className="text-sm font-medium text-zinc-800">
                지역
              </label>
              <select
                id="lab-region"
                name="region"
                value={meta.region}
                onChange={(e) => {
                  setSchoolActiveIdx(-1);
                  setMeta((m) => ({
                    ...m,
                    region: e.target.value,
                    schoolName: "",
                  }));
                }}
                className={selectClass}
                disabled={loading}
                aria-required
              >
                <option value="">지역 선택</option>
                {KOREA_ADMIN_REGIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div ref={schoolWrapRef} className="relative">
              <label htmlFor="lab-school" className="text-sm font-medium text-zinc-800">
                학교명
              </label>
              <input
                id="lab-school"
                type="text"
                name="schoolName"
                autoComplete="off"
                value={meta.schoolName}
                onChange={(e) => {
                  setSchoolActiveIdx(-1);
                  setMeta((m) => ({ ...m, schoolName: e.target.value }));
                  setSchoolSuggestOpen(true);
                }}
                onFocus={() => {
                  if (meta.region) {
                    setSchoolSuggestOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (!meta.region || schoolOptions.length === 0) {
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (!schoolSuggestOpen) {
                      setSchoolSuggestOpen(true);
                    }
                    if (filteredSchools.length === 0) {
                      return;
                    }
                    setSchoolActiveIdx((i) => (i + 1 >= filteredSchools.length ? 0 : i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (filteredSchools.length === 0) {
                      return;
                    }
                    setSchoolActiveIdx((i) => (i <= 0 ? filteredSchools.length - 1 : i - 1));
                  } else if (e.key === "Enter" && schoolSuggestOpen && schoolActiveIdx >= 0) {
                    const name = filteredSchools[schoolActiveIdx];
                    if (name) {
                      e.preventDefault();
                      pickSchool(name);
                    }
                  } else if (e.key === "Escape") {
                    setSchoolSuggestOpen(false);
                    setSchoolActiveIdx(-1);
                  }
                }}
                placeholder={!meta.region ? "먼저 지역을 선택하세요" : "학교명을 입력하면 아래에 검색됩니다"}
                className={inputClass}
                disabled={loading || !meta.region}
                aria-required
                aria-expanded={schoolSuggestOpen && filteredSchools.length > 0}
                aria-controls={schoolListId}
                aria-autocomplete="list"
                role="combobox"
              />
              {schoolSuggestOpen && meta.region && filteredSchools.length > 0 ? (
                <ul
                  ref={schoolListRef}
                  id={schoolListId}
                  role="listbox"
                  className="absolute left-0 right-0 z-[60] mt-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  {filteredSchools.map((name, idx) => (
                    <li key={name} data-idx={idx} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={schoolActiveIdx === idx}
                        className={`flex w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 ${
                          schoolActiveIdx === idx ? "bg-zinc-100" : ""
                        }`}
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          pickSchool(name);
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {schoolSuggestOpen &&
              meta.region &&
              meta.schoolName.trim() &&
              filteredSchools.length === 0 &&
              schoolOptions.length > 0 ? (
                <p className="absolute left-0 right-0 z-[60] mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-lg">
                  일치하는 학교가 없습니다. 검색어를 바꿔 보세요.
                </p>
              ) : null}
              <p className="mt-1 text-right text-xs text-zinc-500">
                교육부 학교 정보 기준(2026.03.31)입니다.
              </p>
            </div>
            <div>
              <label htmlFor="lab-grade" className="text-sm font-medium text-zinc-800">
                참여 학년
              </label>
              <select
                id="lab-grade"
                name="grade"
                value={meta.grade}
                onChange={(e) => setMeta((m) => ({ ...m, grade: e.target.value }))}
                className={selectClass}
                disabled={loading}
                aria-required
              >
                <option value="">학년 선택</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lab-class" className="text-sm font-medium text-zinc-800">
                학반
              </label>
              <input
                id="lab-class"
                type="text"
                name="classSection"
                value={meta.classSection}
                onChange={(e) => setMeta((m) => ({ ...m, classSection: e.target.value }))}
                placeholder="예: 3반"
                className={inputClass}
                disabled={loading}
              />
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {submitError ? (
              <p className="text-sm leading-snug text-red-600" role="alert">
                {submitError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={loading}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  취소
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {loading ? "생성 중…" : "실험실 만들기"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
