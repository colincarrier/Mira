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
  
  // Highly specific icon mapping to ensure uniqueness
  if (name.includes('coffee') || name.includes('cafe')) {
    return { icon: 'coffee', color: 'orange' };
  }
  if (name.includes('food') || name.includes('restaurant') || name.includes('dining')) {
    return { icon: 'utensils', color: 'orange' };
  }
  if (name.includes('book') || name.includes('reading') || name.includes('library')) {
    return { icon: 'book-open', color: 'blue' };
  }
  if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) {
    return { icon: 'plane', color: 'cyan' };
  }
  if (name.includes('work') || name.includes('office') || name.includes('business')) {
    return { icon: 'briefcase', color: 'gray' };
  }
  if (name.includes('project') || name.includes('task')) {
    return { icon: 'folder-open', color: 'blue' };
  }
  if (name.includes('home') || name.includes('house') || name.includes('apartment')) {
    return { icon: 'home', color: 'green' };
  }
  if (name.includes('garden') || name.includes('plant') || name.includes('grow')) {
    return { icon: 'leaf', color: 'green' };
  }
  if (name.includes('health') || name.includes('medical') || name.includes('doctor')) {
    return { icon: 'stethoscope', color: 'red' };
  }
  if (name.includes('fitness') || name.includes('gym') || name.includes('workout')) {
    return { icon: 'dumbbell', color: 'red' };
  }
  if (name.includes('shopping') || name.includes('buy') || name.includes('purchase')) {
    return { icon: 'shopping-cart', color: 'emerald' };
  }
  if (name.includes('store') || name.includes('market') || name.includes('retail')) {
    return { icon: 'store', color: 'emerald' };
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
  if (name.includes('bank') || name.includes('savings') || name.includes('investment')) {
    return { icon: 'piggy-bank', color: 'green' };
  }
  if (name.includes('recipe') || name.includes('cooking') || name.includes('kitchen')) {
    return { icon: 'chef-hat', color: 'orange' };
  }
  if (name.includes('car') || name.includes('vehicle') || name.includes('auto')) {
    return { icon: 'car', color: 'red' };
  }
  if (name.includes('bike') || name.includes('bicycle') || name.includes('cycling')) {
    return { icon: 'bike', color: 'blue' };
  }
  if (name.includes('music') || name.includes('song') || name.includes('playlist')) {
    return { icon: 'music', color: 'purple' };
  }
  if (name.includes('podcast') || name.includes('audio') || name.includes('listen')) {
    return { icon: 'headphones', color: 'purple' };
  }
  if (name.includes('school') || name.includes('university') || name.includes('college')) {
    return { icon: 'graduation-cap', color: 'blue' };
  }
  if (name.includes('learn') || name.includes('study') || name.includes('course')) {
    return { icon: 'graduation-cap', color: 'blue' };
  }
  if (name.includes('movie') || name.includes('film') || name.includes('cinema')) {
    return { icon: 'film', color: 'pink' };
  }
  if (name.includes('tv') || name.includes('show') || name.includes('series')) {
    return { icon: 'tv', color: 'pink' };
  }
  if (name.includes('game') || name.includes('gaming') || name.includes('play')) {
    return { icon: 'gamepad-2', color: 'purple' };
  }
  if (name.includes('gift') || name.includes('present') || name.includes('birthday')) {
    return { icon: 'gift', color: 'pink' };
  }
  if (name.includes('event') || name.includes('party') || name.includes('celebration')) {
    return { icon: 'calendar-days', color: 'indigo' };
  }
  if (name.includes('meeting') || name.includes('appointment') || name.includes('schedule')) {
    return { icon: 'clock', color: 'indigo' };
  }
  if (name.includes('photo') || name.includes('picture') || name.includes('photography')) {
    return { icon: 'camera', color: 'gray' };
  }
  if (name.includes('memory') || name.includes('memories') || name.includes('moment')) {
    return { icon: 'image', color: 'gray' };
  }
  if (name.includes('pet') || name.includes('dog') || name.includes('puppy')) {
    return { icon: 'dog', color: 'pink' };
  }
  if (name.includes('cat') || name.includes('kitten') || name.includes('feline')) {
    return { icon: 'cat', color: 'pink' };
  }
  if (name.includes('tech') || name.includes('computer') || name.includes('software')) {
    return { icon: 'laptop', color: 'gray' };
  }
  if (name.includes('phone') || name.includes('mobile') || name.includes('device')) {
    return { icon: 'smartphone', color: 'gray' };
  }
  if (name.includes('art') || name.includes('design') || name.includes('creative')) {
    return { icon: 'palette', color: 'pink' };
  }
  if (name.includes('writing') || name.includes('journal') || name.includes('blog')) {
    return { icon: 'pen-tool', color: 'blue' };
  }
  if (name.includes('news') || name.includes('article') || name.includes('media')) {
    return { icon: 'newspaper', color: 'gray' };
  }
  if (name.includes('weather') || name.includes('climate') || name.includes('forecast')) {
    return { icon: 'cloud', color: 'cyan' };
  }
  if (name.includes('baby') || name.includes('child') || name.includes('kid')) {
    return { icon: 'baby', color: 'pink' };
  }
  if (name.includes('wedding') || name.includes('marriage') || name.includes('ceremony')) {
    return { icon: 'heart', color: 'pink' };
  }
  if (name.includes('holiday') || name.includes('vacation') || name.includes('break')) {
    return { icon: 'palm-tree', color: 'green' };
  }
  if (name.includes('maintenance') || name.includes('repair') || name.includes('fix')) {
    return { icon: 'wrench', color: 'gray' };
  }
  if (name.includes('cleaning') || name.includes('chore') || name.includes('housework')) {
    return { icon: 'spray-can', color: 'cyan' };
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