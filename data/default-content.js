const defaultContent = {
  services: {
    eyebrow: 'What We Do',
    heading: 'Our Services',
    description: 'Quality home improvement for your deck, siding, and remodeling needs',
    items: [
      {
        icon: 'deck',
        title: 'Deck Builds',
        description:
          'Custom decks built to last. From simple platforms to multi-level designs with railings and stairs.',
      },
      {
        icon: 'siding',
        title: 'Siding',
        description:
          'New siding installation and replacement. Vinyl, wood, or composite-we help you choose and install the right option.',
      },
      {
        icon: 'remodel',
        title: 'Remodels',
        description:
          'Kitchen updates, bathroom renovations, room additions, and whole-home remodels. We handle it all.',
      },
    ],
  },
  portfolio: {
    eyebrow: 'Portfolio',
    heading: 'Our Work',
    description: "Projects we're proud to have built",
    items: [
      {
        title: 'Custom Deck',
        subtitle: 'Backyard deck build',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      },
      {
        title: 'Siding Replacement',
        subtitle: 'Vinyl siding installation',
        imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
      },
      {
        title: 'Kitchen Remodel',
        subtitle: 'Full renovation',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      },
      {
        title: 'Deck & Siding',
        subtitle: 'Exterior refresh',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      },
    ],
  },
  about: {
    eyebrow: 'About Us',
    heading: 'Built on Integrity & Craftsmanship',
    body:
      'Jespersen Erections is a small, hands-on company. We take pride in every deck, siding job, and remodel-treating your home like our own.',
    features: [
      'Licensed & insured',
      'Quality craftsmanship',
      'Personal, direct communication',
      'Fair, honest pricing',
    ],
    stats: [
      { value: 'Local', label: 'Community Focused' },
      { value: 'Quality', label: 'First Priority' },
    ],
  },
  searchResults: {
    title: 'Search Results Data',
    description: 'Track important search queries, visibility, and follow-up notes in one place.',
    rows: [],
  },
};

function cloneDefaultContent() {
  return JSON.parse(JSON.stringify(defaultContent));
}

module.exports = {
  defaultContent,
  cloneDefaultContent,
};
