export default function AccountTab({ onClick }) {
  return (
    <button className="account-tab" onClick={onClick}>
      <span className="account-tab-avatar">A</span>
      <span className="account-tab-info">
        <span className="account-tab-name">My Account</span>
        <span className="account-tab-sub">Manage profile</span>
      </span>
      <span className="account-tab-chevron">›</span>
    </button>
  );
}
