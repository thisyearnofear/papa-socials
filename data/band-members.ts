interface BandMember {
  id: number;
  name: string;
  instrument: string;
  image: string;
  isGroupPhoto?: boolean;
  role?: string;
}

export const bandMembers: BandMember[] = [
  // Group photos interspersed throughout
  {
    id: 1,
    name: "Hootenanny, Brixton",
    instrument: "Full Band",
    image: "/img/demo4/1.jpg",
    isGroupPhoto: true,
  },
  {
    id: 2,
    name: "Papa",
    instrument: "vocals",
    image: "/img/demo4/2.jpg",
  },
  {
    id: 3,
    name: "anatu",
    instrument: "production",
    image: "/img/demo4/3.jpg",
  },
  {
    id: 4,
    name: "Andrew Ace",
    instrument: "bass",
    image: "/img/demo4/4.jpg",
    isGroupPhoto: true,
  },
  {
    id: 5,
    name: "Oscar",
    instrument: "Sax",
    image: "/img/demo4/5.jpg",
  },
  // Add more demo members to reach 30+
  {
    id: 6,
    name: "Congo",
    instrument: "djembe",
    image: "/img/demo4/6.jpg",
  },
  {
    id: 7,
    name: "Cowie",
    instrument: "drums",
    image: "/img/demo4/7.jpg",
    isGroupPhoto: true,
  },
  // Continue with more members...
];
