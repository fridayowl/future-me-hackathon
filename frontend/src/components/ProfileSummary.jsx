import React from "react";
import {
  User,
  CreditCard,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  Banknote,
  Calendar,
  Briefcase,
  Star,
} from "lucide-react";
import defaultAvatar from "../assets/react.svg";

const ProfileSummary = ({ userProfile }) => {
  // 10 stats: 3 left, 3 right, 1 top, 1 bottom, 1 center, 2 extra (can be used for future or left blank)
  const stats = [
    { icon: <User size={28} />, label: "Age" },
    { icon: <CreditCard size={28} />, label: "Credit Score" },
    { icon: <TrendingUp size={28} />, label: "Net Worth" },
    { icon: <AlertCircle size={28} />, label: "Total Debt" },
    { icon: <PiggyBank size={28} />, label: "Savings" },
    { icon: <Briefcase size={28} />, label: "Occupation" },
    { icon: <Calendar size={28} />, label: "Years to Goal" },
    { icon: <Banknote size={28} />, label: "Income" },
    { icon: <Star size={28} />, label: "Achievement" },
  ];

  // Tailwind grid positions for 10 elements in a 3x5 grid
  // [row, col] is 1-based for Tailwind
  const gridItems = [
    { ...stats[0], row: 1, col: 2 }, // top
    { ...stats[1], row: 2, col: 1 }, // left 1
    { ...stats[2], row: 3, col: 1 }, // left 2
    { ...stats[3], row: 4, col: 1 }, // left 3
    { ...stats[4], row: 2, col: 3 }, // right 1
    { ...stats[5], row: 3, col: 3 }, // right 2
    { ...stats[6], row: 4, col: 3 }, // right 3
    { ...stats[7], row: 5, col: 2 }, // bottom
    { ...stats[8], row: 2, col: 2 }, // extra (optional)
    { ...stats[9], row: 4, col: 2 }, // extra (optional)
  ];

  return (
    <div className="profile-summary-grid flex flex-col items-center">
      <div className="grid grid-cols-3 grid-rows-5 gap-2 w-[350px] h-[400px] relative">
        {/* Center avatar */}
        <div className="col-start-2 row-start-2 flex flex-col items-center justify-center z-10">
          <img
            src={defaultAvatar}
            alt="Profile"
            className="profile-avatar w-20 h-20 rounded-full border-4 border-[#2bbda2] bg-[#181f22]"
          />
        </div>
        {/* Stat icons */}
        {gridItems.map((item, idx) => (
          <div
            key={item.label}
            className={`col-start-${item.col} row-start-${item.row} flex flex-col items-center justify-center`}
            style={{ zIndex: 5 }}
            title={item.label}
          >
            {item.icon}
            <div className="profile-grid-label text-xs text-white text-center mt-1">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSummary;
