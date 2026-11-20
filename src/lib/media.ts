const unsplash = (id: string, width = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const media = {
  hero: unsplash("photo-1571896349842-33c89424de2d", 2000),
  heroPortrait: unsplash("photo-1566073771259-6a8506099945", 1000),
  pool: unsplash("photo-1571003123894-1f0594d2b5d9"),
  resort: unsplash("photo-1564501049412-61c2a3083791"),
  villa: unsplash("photo-1613490493576-7fde63acd811"),
  homestay: unsplash("photo-1520250497591-112f2f40a3f4"),
  tea: unsplash("photo-1501785888041-af3ef285b470"),
  backwaters: unsplash("photo-1470770841072-f978cf4d019e"),
  beach: unsplash("photo-1510414842594-a61c69b5ae57"),
  forest: unsplash("photo-1441974231531-c6227db76b6e"),
  mountains: unsplash("photo-1501785888041-af3ef285b470"),
  heritage: unsplash("photo-1542314831-068cd1dbfeeb"),
  balcony: unsplash("photo-1499793983690-e29da59ef1c2"),
  interior: unsplash("photo-1611892440504-42a792e24d32"),
  yoga: unsplash("photo-1540206395-68808572332f"),
  nature: unsplash("photo-1470770841072-f978cf4d019e"),
  avatarOne: unsplash("photo-1500648767791-00dcc994a43e", 200),
  avatarTwo: unsplash("photo-1494790108377-be9c29b29330", 200),
  avatarThree: unsplash("photo-1507003211169-0a1dd7228f2d", 200),
} as const;

export const fallbackPropertyImage = media.resort;
