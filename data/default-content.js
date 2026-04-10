const defaultContent = {
  services: {
    eyebrow: 'What We Do',
    heading: 'Trusted Exterior Services',
    description:
      'Roofing, siding, gutters, and storm restoration with AI-backed insurance support and job-site protection that keeps your landscaping and property safe.',
    items: [
      {
        icon: 'remodel',
        title: 'Storm-Damaged Roofing',
        description:
          'Full roof replacement and repair after hail or wind, installed to code with upgraded components where insurance allows.',
      },
      {
        icon: 'siding',
        title: 'Siding, Gutters & Exterior',
        description:
          'Impact-resistant siding, seamless gutters, wraps, and trim so the whole exterior is restored — not just the shingles.',
      },
      {
        icon: 'deck',
        title: 'AI-Assisted Insurance Claims',
        description:
          'AI tools and adjuster-ready documentation to find missed line items, match local code, and help you secure a fair, complete claim.',
      },
    ],
  },
  portfolio: {
    eyebrow: 'Project Gallery',
    heading: 'Storm Damage In — Built Right Out',
    description:
      "A few examples of roofs, exteriors, and storm restorations we've brought back to better-than-before condition.",
    items: [
      {
        title: 'Hail-Damaged Roof Replacement',
        subtitle: 'Architectural shingles, built-right ventilation, full cleanup',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      },
      {
        title: 'Siding & Gutter Restoration',
        subtitle: 'Storm-damaged vinyl siding replaced with upgraded system',
        imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
      },
      {
        title: 'Full Exterior Storm Rebuild',
        subtitle: 'Roof, fascia, soffit, gutters, and wraps brought back to code',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      },
      {
        title: 'Protected Landscaping Project',
        subtitle: 'Catch-all system kept rock beds and plants debris-free',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      },
    ],
  },
  about: {
    eyebrow: 'About Us',
    heading: 'Built-Right Craftsmanship, Backed by AI',
    body:
      'Jespersen Erections is a storm-restoration contractor that blends hands-on craftsmanship with modern AI tools. We document every layer, build to code, and protect your property with a full catch-all system so the only thing we leave behind is a finished project. From our Joplin base we serve the broader four-state area: Southwest Missouri, Northwest Arkansas, Northeast Oklahoma, and Southeast Kansas.',
    features: [
      'Licensed, insured, and focused on storm-restoration work',
      'AI-assisted supplementing to find missed items in your insurance estimate',
      'Built-right details: WRB, flashing, frieze wrap, window bucks, drainage planes, and more',
      'Catch-all debris system to protect landscaping, driveways, and neighboring properties',
    ],
    stats: [
      { value: 'Storm', label: 'Restoration Focused' },
      { value: 'Code', label: 'Correct Every Time' },
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
