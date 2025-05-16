import { useState } from 'react';

const ReadMore = ({ text, wordLimit = 50, expandLabel = 'Ver más', collapseLabel = 'Ver menos' }) => {
  const words = text.split(/\s+/);
  const isLong = words.length > wordLimit;
  const [expanded, setExpanded] = useState(false);

  if (!isLong) {
    return <p className="text-neutral-600 mb-4">{text}</p>;
  }

  const displayed = expanded
    ? text
    : words.slice(0, wordLimit).join(' ') + '...';

  return (
    <div>
      <p className="text-neutral-600 mb-4">{displayed}</p>
      <button
        className="text-primary-500 hover:text-primary-600 font-medium"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
};

export default ReadMore;
