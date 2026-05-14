const FRAME_SHAPE_OPTIONS = ['Round', 'Square', 'Rectangle', 'Cat Eye', 'Geometric', 'Aviator', 'Oval', 'Wayfarer'];
const FRAME_TYPE_OPTIONS = ['Full Rim', 'Rimless', 'Half Rim', 'Low Bridge Fit'];
const COLOR_OPTIONS = ['Black', 'Gold', 'Silver', 'Gunmetal', 'Transparent', 'Brown', 'Blue', 'Rose Gold'];
const THEME_OPTIONS = ['Classic', 'Modern', 'Luxury', 'Minimalist', 'Sport', 'Vintage'];

const normalizeText = (value = '') => String(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const findOption = (value, options) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';
  return options.find((option) => normalizeText(option) === normalizedValue) || '';
};
const inferOptionFromText = (text, options) => {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return '';
  return [...options]
    .sort((a, b) => normalizeText(b).length - normalizeText(a).length)
    .find((option) => normalizedText.includes(normalizeText(option))) || '';
};

// ... copy getFacetedCount logic ...
// Let's just output it to see if there is any obvious issue.
