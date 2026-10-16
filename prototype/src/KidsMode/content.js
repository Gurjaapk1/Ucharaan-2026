export const characters = [{ id: 'prem', name: 'Prem Singh' }, { id: 'sehaj', name: 'Sehaj Kaur' }];
export const regions = [
    { name: 'The beginning', place: 'Punjab’s open fields', start: 1, end: 6 },
    { name: 'By the river', place: 'Sultanpur Lodhi inspired', start: 7, end: 12 },
    { name: 'Paths of listening', place: 'Village paths', start: 13, end: 18 },
    { name: 'An open horizon', place: 'Fields and foothills', start: 19, end: 24 },
    { name: 'A world of wonder', place: 'Mountain trails', start: 25, end: 30 },
    { name: 'Growing in grace', place: 'Kartarpur inspired', start: 31, end: 38 },
];
export const collection = [
    { id: 'classic', name: 'Classic explorer', cost: 0, color: '#c4d4ea' },
    { id: 'sky', name: 'Sky frame', cost: 0, color: '#7daed1' },
    { id: 'sunshine', name: 'Sunshine frame', cost: 10, color: '#d6ad32' },
    { id: 'river', name: 'River explorer', cost: 20, color: '#3477bd' },
    { id: 'garden', name: 'Garden explorer', cost: 30, color: '#65955d' },
];
export function lineScore(score, index, lineCount) {
    return score < 95 && index < Math.floor(lineCount / 3) * 3 ? score + (index % 3 === 1 ? -16 : 8) : score;
}
