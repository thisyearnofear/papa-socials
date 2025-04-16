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
    name: "Hoots",
    instrument: "Jim Jams",
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
  },
  {
    id: 8,
    name: "Old Queens Head",
    instrument: "Strum",
    image: "/img/demo4/8.jpg",
    isGroupPhoto: true,
  },
  {
    id: 9,
    name: "Prizz",
    instrument: "Vocals",
    image: "/img/demo4/9.jpg",
  },
  {
    id: 10,
    name: "Prince Of Wales",
    instrument: "Brixton",
    image: "/img/demo4/10.jpg",
    isGroupPhoto: true,
  },
  {
    id: 11,
    name: "Jaz",
    instrument: "Tenor Sax",
    image: "/img/demo4/11.jpg",
  },
  {
    id: 12,
    name: "Jack",
    instrument: "Soprano Sax",
    image: "/img/demo4/12.jpg",
  },
  // Continue with more members...
];
