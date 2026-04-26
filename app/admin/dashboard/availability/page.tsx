"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ─── helpers ────────────────────────────────────────────────
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ─── types ───────────────────────────────────────────────────
interface TimeWindow {
  id: string;
  label: string;
  display_order: number;
  is_active: boolean;
}
type SlotKey = string;

// ─── small inline-confirm component ──────────────────────────
function InlineConfirm({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
      <AlertTriangle size={14} className="text-red-500 shrink-0" />
      <span className="text-red-700 text-xs">{message}</span>
      <button
        onClick={onConfirm}
        className="ml-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded transition-colors"
      >
        Yes, delete
      </button>
      <button
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-700 text-xs font-medium"
      >
        Cancel
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────
export default function AvailabilityPage() {
  // ── week grid ──
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [slots, setSlots] = useState<Set<SlotKey>>(new Set());
  const [original, setOriginal] = useState<Set<SlotKey>>(new Set());
  const [gridLoading, setGridLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── time windows ──
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [winLoading, setWinLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [addingWin, setAddingWin] = useState(false);

  // edit state: id → label being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // delete confirmation: id to confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // drag & drop reorder
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const activeWindows = windows
    .filter((w) => w.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // ── load windows ──
  const loadWindows = useCallback(async () => {
    setWinLoading(true);
    try {
      const res = await fetch("/api/admin/time-windows");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setWindows(json.windows || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load time windows");
    } finally {
      setWinLoading(false);
    }
  }, []);

  useEffect(() => { loadWindows(); }, [loadWindows]);

  // ── load slots ──
  const loadSlots = useCallback(async () => {
    setGridLoading(true);
    try {
      const res = await fetch(`/api/admin/availability?week_start=${toDateStr(weekStart)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const set = new Set<SlotKey>(
        (json.slots || [])
          .filter((s: { is_available: boolean }) => s.is_available)
          .map((s: { date: string; time_window: string }) => `${s.date}|${s.time_window}`)
      );
      setSlots(new Set(set));
      setOriginal(new Set(set));
    } catch {
      toast.error("Failed to load availability");
    } finally {
      setGridLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // ── grid helpers ──
  const toggle = (date: Date, win: string) => {
    const key: SlotKey = `${toDateStr(date)}|${win}`;
    setSlots((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isDirty = () => {
    if (slots.size !== original.size) return true;
    return Array.from(slots).some((k) => !original.has(k));
  };

  const saveSlots = async () => {
    setSaving(true);
    try {
      const allSlots = weekDays.flatMap((day) =>
        activeWindows.map((w) => ({
          date: toDateStr(day),
          time_window: w.label,
          is_available: slots.has(`${toDateStr(day)}|${w.label}`),
        }))
      );
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: allSlots }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Availability saved!");
      setOriginal(new Set(slots));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    const next = new Set<SlotKey>();
    weekDays.forEach((day) => activeWindows.forEach((w) => next.add(`${toDateStr(day)}|${w.label}`)));
    setSlots(next);
  };
  const clearAll = () => setSlots(new Set());
  const selectWeekdays = () => {
    const next = new Set<SlotKey>();
    weekDays
      .filter((d) => d.getDay() !== 0 && d.getDay() !== 6)
      .forEach((day) => activeWindows.forEach((w) => next.add(`${toDateStr(day)}|${w.label}`)));
    setSlots(next);
  };

  // ── add window ──
  const addWindow = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setAddingWin(true);
    try {
      const res = await fetch("/api/admin/time-windows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setNewLabel("");
      await loadWindows();
      toast.success(`"${label}" added`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAddingWin(false);
    }
  };

  // ── edit window ──
  const startEdit = (win: TimeWindow) => {
    setEditingId(win.id);
    setEditLabel(win.label);
    setConfirmDeleteId(null); // close any open delete confirm
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const saveEdit = async (id: string) => {
    const label = editLabel.trim();
    if (!label) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/time-windows?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      // Update locally without refetching
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, label } : w)));
      setEditingId(null);
      setEditLabel("");
      toast.success("Renamed successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to rename");
    } finally {
      setEditSaving(false);
    }
  };

  // ── toggle visibility ──
  const toggleActive = async (win: TimeWindow) => {
    // Turning off — API will check for active bookings and return 409 if blocked
    try {
      const res = await fetch(`/api/admin/time-windows?id=${win.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !win.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setWindows((prev) =>
        prev.map((w) => (w.id === win.id ? { ...w, is_active: !win.is_active } : w))
      );
      toast.success(win.is_active ? "Hidden from customers" : "Visible to customers");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  // ── delete window ──
  const confirmDelete = (id: string) => {
    setConfirmDeleteId(id);
    setEditingId(null); // close any open edit
  };

  const doDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/time-windows?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setWindows((prev) => prev.filter((w) => w.id !== id));
      setConfirmDeleteId(null);
      toast.success("Deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // ── drag & drop reorder ──
  const onDragStart = (id: string) => setDragId(id);

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  };

  const onDrop = async (targetId: string) => {
    setDragOverId(null);
    if (!dragId || dragId === targetId) { setDragId(null); return; }

    const sorted = [...windows].sort((a, b) => a.display_order - b.display_order);
    const fromIdx = sorted.findIndex((w) => w.id === dragId);
    const toIdx   = sorted.findIndex((w) => w.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDragId(null); return; }

    // Reorder array
    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Optimistic update
    const updated = reordered.map((w, i) => ({ ...w, display_order: i + 1 }));
    setWindows(updated);
    setDragId(null);

    // Persist all changed orders — compare by ID against original order
    const originalOrder: Record<string, number> = Object.fromEntries(
      sorted.map((w) => [w.id, w.display_order])
    );
    const changed = updated.filter((w) => w.display_order !== originalOrder[w.id]);
    await Promise.all(
      changed.map((w) =>
        fetch(`/api/admin/time-windows?id=${w.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: w.display_order }),
        })
      )
    );
  };

  const onDragEnd = () => { setDragId(null); setDragOverId(null); };

  // ─────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <Toaster position="top-right" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage arrival windows and set which slots customers can book each week.
        </p>
      </div>

      {/* ── TIME WINDOWS ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Arrival Windows</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Add, rename, reorder, or hide time slots. Windows with active bookings cannot be deleted or hidden.
          </p>
        </div>

        {/* Window list */}
        <div className="divide-y divide-gray-100">
          {winLoading ? (
            <div className="px-5 py-5 text-sm text-gray-400">Loading…</div>
          ) : windows.length === 0 ? (
            <div className="px-5 py-5 text-sm text-gray-400">No time windows yet.</div>
          ) : (
            [...windows]
              .sort((a, b) => a.display_order - b.display_order)
              .map((win) => (
                <div
                  key={win.id}
                  draggable
                  onDragStart={() => onDragStart(win.id)}
                  onDragOver={(e) => onDragOver(e, win.id)}
                  onDrop={() => onDrop(win.id)}
                  onDragEnd={onDragEnd}
                  className={`px-5 py-3 space-y-2 transition-colors ${
                    dragOverId === win.id
                      ? "bg-amber-50 border-t-2 border-[#F5A000]"
                      : dragId === win.id
                      ? "opacity-40 bg-gray-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <div
                      className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
                      title="Drag to reorder"
                    >
                      <GripVertical size={18} />
                    </div>

                    {/* Label / edit input */}
                    {editingId === win.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(win.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="border border-[#F5A000] rounded px-2.5 py-1.5 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                          autoFocus
                          disabled={editSaving}
                        />
                        <button
                          onClick={() => saveEdit(win.id)}
                          disabled={editSaving || !editLabel.trim()}
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white px-2.5 py-1.5 rounded text-xs font-semibold transition-colors"
                        >
                          <Check size={13} />
                          {editSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={editSaving}
                          className="text-gray-400 hover:text-gray-700 p-1.5 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`flex-1 text-sm font-semibold ${
                          win.is_active ? "text-gray-800" : "text-gray-400 line-through"
                        }`}
                      >
                        {win.label}
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        win.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {win.is_active ? "Visible" : "Hidden"}
                    </span>

                    {/* Action buttons */}
                    {editingId !== win.id && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => startEdit(win)}
                          title="Rename"
                          className="p-1.5 text-gray-400 hover:text-[#F5A000] rounded transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive(win)}
                          title={win.is_active ? "Hide from customers" : "Show to customers"}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded transition-colors"
                        >
                          {win.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => confirmDelete(win.id)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline delete confirmation */}
                  {confirmDeleteId === win.id && (
                    <InlineConfirm
                      message={`Delete "${win.label}"? This cannot be undone.`}
                      onConfirm={() => doDelete(win.id)}
                      onCancel={() => setConfirmDeleteId(null)}
                    />
                  )}
                  {deletingId === win.id && (
                    <p className="text-xs text-gray-400 pl-1">Deleting…</p>
                  )}
                </div>
              ))
          )}
        </div>

        {/* Add new window */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-2">Add New Window</p>
          <div className="flex items-center gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWindow()}
              placeholder="e.g. 8AM-10AM"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
              disabled={addingWin}
            />
            <button
              onClick={addWindow}
              disabled={addingWin || !newLabel.trim()}
              className="flex items-center gap-1.5 bg-[#F5A000] hover:bg-[#d48800] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-3 py-1.5 rounded text-sm transition-colors"
            >
              <Plus size={14} />
              {addingWin ? "Adding…" : "Add Window"}
            </button>
          </div>
        </div>
      </div>

      {/* ── WEEKLY GRID ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">Weekly Slot Availability</h2>
        <button
          onClick={saveSlots}
          disabled={saving || !isDirty()}
          className="flex items-center gap-2 bg-[#F5A000] hover:bg-[#d48800] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold px-5 py-2 rounded text-sm transition-colors"
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Nav header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="flex items-center gap-1 text-sm font-semibold text-[#F5A000] hover:text-[#d48800] transition-colors"
          >
            <ChevronLeft size={16} /> PREV WEEK
          </button>
          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">{formatWeekRange(weekStart)}</div>
            <div className="flex items-center gap-3 mt-1 justify-center">
              <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
                Select all
              </button>
              <button onClick={selectWeekdays} className="text-xs text-blue-600 hover:underline">
                Weekdays only
              </button>
              <button onClick={clearAll} className="text-xs text-red-500 hover:underline">
                Clear all
              </button>
            </div>
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="flex items-center gap-1 text-sm font-semibold text-[#F5A000] hover:text-[#d48800] transition-colors"
          >
            NEXT WEEK <ChevronRight size={16} />
          </button>
        </div>

        {/* Grid table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="bg-[#1A1A1A] text-white text-xs font-bold px-3 py-3 text-left w-32 border-r border-gray-600">
                  ARRIVAL WINDOWS
                </th>
                {weekDays.map((day, i) => (
                  <th
                    key={i}
                    className="bg-[#1A1A1A] text-white text-center py-3 px-1 text-xs font-bold border-r border-gray-600 last:border-r-0"
                  >
                    <div className="text-sm font-bold">{formatMonthDay(day)}</div>
                    <div className="text-[10px] tracking-widest mt-0.5">{DAY_LABELS[i]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeWindows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-sm text-gray-400">
                    No active arrival windows. Add one above.
                  </td>
                </tr>
              ) : (
                activeWindows.map((win, wi) => (
                  <tr key={win.id} className={wi % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="text-sm font-semibold text-gray-700 px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      {win.label}
                    </td>
                    {weekDays.map((day, di) => {
                      const key: SlotKey = `${toDateStr(day)}|${win.label}`;
                      const isOn = slots.has(key);
                      return (
                        <td
                          key={di}
                          onClick={() => !gridLoading && toggle(day, win.label)}
                          title={isOn ? "Click to mark unavailable" : "Click to mark available"}
                          className={`text-center px-0 py-0 border-r border-gray-100 last:border-r-0 cursor-pointer select-none ${
                            gridLoading ? "opacity-50 cursor-wait" : ""
                          }`}
                        >
                          <div
                            className={`w-full min-h-[48px] flex items-center justify-center transition-colors ${
                              isOn
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isOn ? "border-white bg-white" : "border-gray-300 bg-white"
                              }`}
                            >
                              {isOn && <div className="w-2 h-2 rounded-full bg-green-600" />}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs text-gray-600">Available (customers can book)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-gray-200 bg-gray-100" />
            <span className="text-xs text-gray-600">Not Available</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Click cells to toggle. Changes are not saved until you click{" "}
        <strong>Save Changes</strong>.
      </p>
    </AdminLayout>
  );
}
