"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PendingFile = { id: string; file: File };

export function FileDropzone({
  label,
  hint,
  files,
  onChange,
}: {
  label: string;
  hint?: string;
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).map((file) => ({ id: crypto.randomUUID(), file }));
    onChange([...files, ...next]);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-navy-700">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragOver ? "border-orange-400 bg-orange-50" : "border-grey-200 bg-grey-50 hover:border-orange-300 hover:bg-orange-50/50"
        )}
      >
        <motion.div animate={dragOver ? { scale: 1.15, y: -3 } : { scale: 1, y: 0 }}>
          <UploadCloud className={cn("size-6", dragOver ? "text-orange-500" : "text-grey-400")} />
        </motion.div>
        <p className="mt-1.5 text-xs font-medium text-navy-600">
          Drag & drop, or <span className="text-orange-600">browse</span>
        </p>
        {hint && <p className="text-[11px] text-grey-400">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {files.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs shadow-soft"
              >
                <FileText className="size-3.5 shrink-0 text-orange-500" />
                <span className="flex-1 truncate text-navy-700">{f.file.name}</span>
                <Check className="size-3.5 shrink-0 text-emerald-500" />
                <button
                  type="button"
                  onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                  className="shrink-0 text-grey-400 hover:text-red-500"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
