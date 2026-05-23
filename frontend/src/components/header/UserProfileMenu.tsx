interface UserProfileMenuProps {
  user: { name: string };
  onOpenModal: () => void;
}

export const UserProfileMenu = ({ user, onOpenModal }: UserProfileMenuProps) => {
  return (
    <button
      onClick={onOpenModal}
      className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer"
    >
      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:animate-pulse"></div>
      <span className="text-[10px] font-black uppercase tracking-widest text-surface-200 group-hover:text-white transition-colors">
        {user.name.split(" ")[0]}
      </span>
    </button>
  );
};
