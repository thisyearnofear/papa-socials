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
    isGroupPhoto: true
  },
  {
    id: 2,
    name: "John Smith",
    instrument: "Lead Vocals",
    image: "/img/demo4/2.jpg"
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    instrument: "Bass Guitar",
    image: "/img/demo4/3.jpg"
  },
  {
    id: 4,
    name: "PAPA Studio Session",
    instrument: "Full Band",
    image: "/img/demo4/4.jpg",
    isGroupPhoto: true
  },
  {
    id: 5,
    name: "David Chen",
    instrument: "Drums",
    image: "/img/demo4/5.jpg"
  },
  // Add more demo members to reach 30+
  {
    id: 6,
    name: "Sarah Johnson",
    instrument: "Lead Guitar",
    image: "/img/demo4/2.jpg"
  },
  {
    id: 7,
    name: "PAPA Rehearsal",
    instrument: "Full Band",
    image: "/img/demo4/3.jpg",
    isGroupPhoto: true
  },
  // Continue with more members...
  {
    id: 30,
    name: "Michael Brown",
    instrument: "Keyboards",
    image: "/img/demo4/5.jpg"
  }
];
