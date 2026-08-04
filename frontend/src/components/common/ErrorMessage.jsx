export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <div className="ui-alert ui-alert--error" role="alert">{message}</div>;
}
