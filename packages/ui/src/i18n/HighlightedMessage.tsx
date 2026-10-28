import { Fragment } from 'react';

export type HighlightedMessageProps = {
  message: string;
  value: string;
};

export function HighlightedMessage({
  message,
  value,
}: HighlightedMessageProps) {
  if (!value) return message;
  const parts = message.split(value);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <span className="font-medium text-gray-700">{value}</span>}
      {part}
    </Fragment>
  ));
}
