import React from 'react';

export default function SkillTag({ text, skill }) {
  const name = skill?.name || text;

  return (
    <span className="skill-tag">
      {name}
    </span>
  );
}
