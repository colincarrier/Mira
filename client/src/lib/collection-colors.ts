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

export const getUniqueCollectionIcon = (collectionName: string) => {
  const name = collectionName.toLowerCase();
  
  // Smart icon mapping based on collection name
  if (name.includes('coffee') || name.includes('food') || name.includes('restaurant')) {
    return { icon: 'coffee', color: 'orange' };
  }
  if (name.includes('book') || name.includes('reading') || name.includes('library')) {
    return { icon: 'book-open', color: 'blue' };
  }
  if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) {
    return { icon: 'plane', color: 'cyan' };
  }
  if (name.includes('work') || name.includes('project') || name.includes('business')) {
    return { icon: 'briefcase', color: 'gray' };
  }
  if (name.includes('home') || name.includes('house') || name.includes('apartment')) {
    return { icon: 'home', color: 'green' };
  }
  if (name.includes('health') || name.includes('medical') || name.includes('doctor')) {
    return { icon: 'heart', color: 'red' };
  }
  if (name.includes('shopping') || name.includes('buy') || name.includes('purchase')) {
    return { icon: 'shopping-cart', color: 'emerald' };
  }
  if (name.includes('idea') || name.includes('thought') || name.includes('brainstorm')) {
    return { icon: 'lightbulb', color: 'yellow' };
  }
  if (name.includes('goal') || name.includes('target') || name.includes('achievement')) {
    return { icon: 'target', color: 'purple' };
  }
  if (name.includes('finance') || name.includes('money') || name.includes('budget')) {
    return { icon: 'dollar-sign', color: 'green' };
  }
  if (name.includes('recipe') || name.includes('cooking') || name.includes('kitchen')) {
    return { icon: 'chef-hat', color: 'orange' };
  }
  if (name.includes('car') || name.includes('vehicle') || name.includes('driving')) {
    return { icon: 'car', color: 'red' };
  }
  if (name.includes('music') || name.includes('song') || name.includes('playlist')) {
    return { icon: 'music', color: 'purple' };
  }
  if (name.includes('exercise') || name.includes('workout') || name.includes('fitness')) {
    return { icon: 'dumbbell', color: 'red' };
  }
  if (name.includes('school') || name.includes('education') || name.includes('learn')) {
    return { icon: 'graduation-cap', color: 'blue' };
  }
  if (name.includes('movie') || name.includes('film') || name.includes('entertainment')) {
    return { icon: 'film', color: 'pink' };
  }
  if (name.includes('gift') || name.includes('present') || name.includes('birthday')) {
    return { icon: 'gift', color: 'pink' };
  }
  if (name.includes('event') || name.includes('party') || name.includes('celebration')) {
    return { icon: 'calendar', color: 'indigo' };
  }
  if (name.includes('photo') || name.includes('picture') || name.includes('memory')) {
    return { icon: 'camera', color: 'gray' };
  }
  if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
    return { icon: 'heart', color: 'pink' };
  }
  
  // Default fallback icons for common collection types
  const fallbackIcons = [
    { icon: 'folder', color: 'blue' },
    { icon: 'star', color: 'yellow' },
    { icon: 'bookmark', color: 'purple' },
    { icon: 'tag', color: 'green' },
    { icon: 'archive', color: 'gray' },
    { icon: 'layers', color: 'teal' },
    { icon: 'paperclip', color: 'indigo' },
    { icon: 'flag', color: 'red' }
  ];
  
  // Use hash of collection name to get consistent icon
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return fallbackIcons[Math.abs(hash) % fallbackIcons.length];
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