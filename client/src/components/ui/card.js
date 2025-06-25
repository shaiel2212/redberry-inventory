// components/ui/card.js
export const Card = ({ children, className = "" }) => {
  return (
    <div className={`rounded-xl shadow p-4 bg-white ${className}`}>
      {children}
    </div>
  );
};
