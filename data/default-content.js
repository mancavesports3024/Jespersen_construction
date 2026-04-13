const defaultContent = {
  services: {
    eyebrow: 'What we do',
    heading: 'Roofing and exterior services in Joplin',
    description:
      'Roofing, siding, gutters, and full storm restoration — backed by AI‑powered insurance support and job‑site protection that keeps your landscaping and property safe.',
    items: [
      {
        icon: 'remodel',
        title: 'Roof repair & replacement',
        description:
          'Code‑correct roof replacement and repair after hail or wind damage, with upgraded components whenever insurance allows.',
        link: '/services/roofing',
        linkLabel: 'Roofing details',
      },
      {
        icon: 'siding',
        title: 'Siding, gutters & exterior',
        description:
          'Impact‑resistant siding, seamless gutters, wraps, and trim — restoring the entire exterior, not just the shingles.',
        link: '/services/siding-and-exterior',
        linkLabel: 'Exterior details',
      },
      {
        icon: 'storm',
        title: 'Storm restoration',
        description:
          'From inspection through cleanup: documentation for adjusters, supplements when scopes are thin, and catch-all debris control.',
        link: '/services/storm-restoration',
        linkLabel: 'Storm restoration',
      },
      {
        icon: 'deck',
        title: 'Insurance claim help',
        description:
          'AI‑driven claim review and adjuster‑ready documentation that uncovers missed line items, matches code requirements, and helps you secure a fair, complete claim.',
        link: '/insurance-claims',
        linkLabel: 'Claims & upload',
      },
    ],
  },
  portfolio: {
    eyebrow: 'Project gallery',
    heading: 'Storm damage in — built right out',
    description:
      "Roofs, siding, and full exteriors we've restored for homeowners in Joplin and the four-state area.",
    items: [
      {
        title: 'Hail-damaged roof replacement',
        subtitle: 'Architectural shingles, built-right ventilation, full cleanup',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      },
      {
        title: 'Siding & gutter restoration',
        subtitle: 'Storm-damaged siding replaced with a complete drainage plane',
        imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
      },
      {
        title: 'Full exterior storm rebuild',
        subtitle: 'Roof, fascia, soffit, gutters, and wraps brought back to code',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      },
      {
        title: 'Protected landscaping',
        subtitle: 'Catch-all system kept beds and plantings debris-free',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      },
    ],
  },
  about: {
    eyebrow: 'Why homeowners call us',
    heading: 'Local roofing and exterior construction',
    body:
      'Jespersen Erections is a Joplin-based team focused on roofing and exterior construction after storms and normal wear. We combine hands-on installation with clear insurance documentation—so you know what we found, what we recommend, and what was installed.',
    features: [
      'Licensed and insured; work scoped and built to code',
      'Adjuster-ready photos, measurements, and supplement support when estimates are incomplete',
      'Built-right details: WRB, flashing, ventilation, gutters tied to the drainage plan',
      'Catch-all debris control on jobs where your yard and neighbors need protection',
    ],
    stats: [
      { value: 'Joplin', label: 'Home base' },
      { value: '4-state', label: 'Service area' },
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
