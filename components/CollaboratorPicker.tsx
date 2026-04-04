'use client';

import type { Collaborator } from '@/lib/context';
import { COLLABORATORS } from '@/lib/context';

interface CollaboratorPickerProps {
  selected: Collaborator[];
  onChange: (selected: Collaborator[]) => void;
}

export default function CollaboratorPicker({ selected, onChange }: CollaboratorPickerProps) {
  const toggle = (name: Collaborator) => {
    if (selected.includes(name)) {
      onChange(selected.filter(c => c !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <div className="collab-picker">
      {COLLABORATORS.map(name => (
        <button
          key={name}
          type="button"
          className={`collab-chip ${selected.includes(name) ? 'selected' : ''} collab-chip-${name.toLowerCase()}`}
          onClick={() => toggle(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

export function CollaboratorBadges({ assignees }: { assignees: Collaborator[] }) {
  if (!assignees || assignees.length === 0) return null;
  return (
    <div className="collab-badges">
      {assignees.map(name => (
        <span key={name} className={`collab-badge collab-badge-${name.toLowerCase()}`}>
          {name}
        </span>
      ))}
    </div>
  );
}
