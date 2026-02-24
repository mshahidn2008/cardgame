import { useState } from "react";
import type { Card } from "../types";
import { useDeck } from "../hooks/useDeck";

interface EditState {
  id: string;
  spanish: string;
  english: string;
}

interface DeleteConfirm {
  id: string;
  spanish: string;
}

export default function CardManager() {
  const { cards, addCard, editCard, deleteCard } = useDeck();

  // Add form state
  const [newSpanish, setNewSpanish] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [addError, setAddError] = useState("");

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editError, setEditError] = useState("");

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpanish.trim() || !newEnglish.trim()) {
      setAddError("Both Spanish and English fields are required.");
      return;
    }
    addCard(newSpanish, newEnglish);
    setNewSpanish("");
    setNewEnglish("");
    setAddError("");
  }

  function handleEditOpen(card: Card) {
    setEditState({ id: card.id, spanish: card.spanish, english: card.english });
    setEditError("");
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editState) return;
    if (!editState.spanish.trim() || !editState.english.trim()) {
      setEditError("Both fields are required.");
      return;
    }
    editCard(editState.id, editState.spanish, editState.english);
    setEditState(null);
    setEditError("");
  }

  function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    deleteCard(deleteConfirm.id);
    setDeleteConfirm(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Cards</h1>

      {/* Add Card Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Card</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Spanish"
            value={newSpanish}
            onChange={(e) => setNewSpanish(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            placeholder="English"
            value={newEnglish}
            onChange={(e) => setNewEnglish(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            + Add Card
          </button>
        </form>
        {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
      </div>

      {/* Cards Table */}
      {cards.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No cards yet. Add one above!</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Spanish
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  English
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                  {editState?.id === card.id ? (
                    <td colSpan={3} className="px-4 py-3">
                      <form onSubmit={handleEditSave} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input
                          type="text"
                          value={editState.spanish}
                          onChange={(e) =>
                            setEditState((s) => s ? { ...s, spanish: e.target.value } : s)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <input
                          type="text"
                          value={editState.english}
                          onChange={(e) =>
                            setEditState((s) => s ? { ...s, english: e.target.value } : s)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditState(null); setEditError(""); }}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        {editError && (
                          <p className="text-red-500 text-xs w-full">{editError}</p>
                        )}
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-800">{card.spanish}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{card.english}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditOpen(card)}
                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: card.id, spanish: card.spanish })}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Card</h3>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">"{deleteConfirm.spanish}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
