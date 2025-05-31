export const getCollectionColor = (color: string) => {
  const colorMap = {
    orange: {
      bg: "bg-orange-500",
      text: "text-orange-600",
      light: "bg-orange-100",
      border: "border-orange-200"
    },
    purple: {
      bg: "bg-purple-500",
      text: "text-purple-600",
      light: "bg-purple-100",
      border: "border-purple-200"
    },
    green: {
      bg: "bg-green-500",
      text: "text-green-600",
      light: "bg-green-100",
      border: "border-green-200"
    },
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-600",
      light: "bg-blue-100",
      border: "border-blue-200"
    },
    red: {
      bg: "bg-red-500",
      text: "text-red-600",
      light: "bg-red-100",
      border: "border-red-200"
    },
    yellow: {
      bg: "bg-yellow-500",
      text: "text-yellow-600",
      light: "bg-yellow-100",
      border: "border-yellow-200"
    },
    pink: {
      bg: "bg-pink-500",
      text: "text-pink-600",
      light: "bg-pink-100",
      border: "border-pink-200"
    },
    indigo: {
      bg: "bg-indigo-500",
      text: "text-indigo-600",
      light: "bg-indigo-100",
      border: "border-indigo-200"
    },
    teal: {
      bg: "bg-teal-500",
      text: "text-teal-600",
      light: "bg-teal-100",
      border: "border-teal-200"
    },
    gray: {
      bg: "bg-gray-500",
      text: "text-gray-600",
      light: "bg-gray-100",
      border: "border-gray-200"
    },
    cyan: {
      bg: "bg-cyan-500",
      text: "text-cyan-600",
      light: "bg-cyan-100",
      border: "border-cyan-200"
    },
    emerald: {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      light: "bg-emerald-100",
      border: "border-emerald-200"
    }
  };

  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
};

export const getIconColorByType = (iconName: string) => {
  const iconColorMap = {
    coffee: "orange",
    lightbulb: "yellow",
    book: "blue",
    heart: "pink",
    star: "yellow",
    briefcase: "gray",
    home: "green",
    car: "red",
    plane: "cyan",
    checklist: "purple",
    calendar: "indigo",
    location: "red",
    shopping: "emerald"
  };

  return iconColorMap[iconName as keyof typeof iconColorMap] || "gray";
};