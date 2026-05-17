import { useState, useEffect, useCallback } from 'react';

interface DraggableListOptions<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  idField: keyof T;
  componentName: string;
}

export function useDraggableList<T extends { [key: string]: any }>({
  items,
  onReorder,
  idField,
  componentName
}: DraggableListOptions<T>) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const log = useCallback((message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    window.dispatchEvent(new CustomEvent('sys_log', {
      detail: { message: `[${componentName}] ${message}`, type }
    }));
  }, [componentName]);

  const resetDragState = useCallback(() => {
    setDraggedItemId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, []);

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (draggedItemId) {
        log('Drag cycle terminated externally.', 'warn');
        resetDragState();
      }
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    return () => window.removeEventListener('dragend', handleGlobalDragEnd);
  }, [draggedItemId, resetDragState, log]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    log(`Initiated reorder sequence for ID: ${id}`);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id === draggedItemId) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? 'before' : 'after';
    
    if (dropTargetId !== id || dropPosition !== position) {
      setDropTargetId(id);
      setDropPosition(position);
    }
  };

  const handleDrop = (targetId: string | null) => {
    if (!draggedItemId || (targetId && draggedItemId === targetId)) {
      log('Drop targets rejected or identical index detected.', 'warn');
      resetDragState();
      return;
    }

    const oldIndex = items.findIndex(item => String(item[idField]) === draggedItemId);
    let newIndex = targetId ? items.findIndex(item => String(item[idField]) === targetId) : items.length;

    if (dropPosition === 'after') newIndex += 1;
    if (oldIndex < newIndex && targetId) newIndex -= 1;

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      log(`Execution of positional shift: ${oldIndex} -> ${newIndex}`);
      const newItems = [...items];
      const [moved] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, moved);
      onReorder(newItems);
    } else {
      log('No positional delta detected. Operation aborted.', 'info');
    }
    
    resetDragState();
  };

  return {
    draggedItemId,
    dropTargetId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd: resetDragState,
    resetDragState,
    setDropTargetId,
    setDropPosition
  };
}
