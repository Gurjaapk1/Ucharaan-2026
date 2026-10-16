export const characters = [{ id: 'prem', name: 'Prem Singh' }, { id: 'sehaj', name: 'Sehaj Kaur' }];
// Node centers are percentages of the painted terrain, in pauri order.
export const regions = [
  {
    "name": "The beginning",
    "place": "Fields and open gates",
    "start": 1,
    "end": 6,
    "image": "regions/fields.jpg",
    "description": "Golden fields, a banyan tree, stone pool and open gate",
    "nodes": [
      [
        21,
        84.5
      ],
      [
        44.5,
        65.7
      ],
      [
        64,
        52.7
      ],
      [
        84,
        39.3
      ],
      [
        51,
        27.7
      ],
      [
        24,
        13.8
      ]
    ],
    "aspectRatio": 0.8571428571428571
  },
  {
    "name": "By the river",
    "place": "Riverbanks and quiet groves",
    "start": 7,
    "end": 12,
    "image": "regions/river.jpg",
    "description": "Blue river, reeds, river steps and a quiet reading pavilion",
    "nodes": [
      [
        21,
        84.5
      ],
      [
        44.5,
        65.7
      ],
      [
        64,
        52.7
      ],
      [
        84,
        39.3
      ],
      [
        51,
        27.7
      ],
      [
        24,
        13.8
      ]
    ],
    "aspectRatio": 0.8571428571428571
  },
  {
    "name": "Paths of listening",
    "place": "Bridges and sheltered paths",
    "start": 13,
    "end": 18,
    "image": "regions/paths.jpg",
    "description": "Rolling green hills, a stone bridge, rooted tree and sheltered paths",
    "nodes": [
      [
        21,
        84.5
      ],
      [
        44.5,
        65.7
      ],
      [
        64,
        52.7
      ],
      [
        84,
        39.3
      ],
      [
        51,
        27.7
      ],
      [
        24,
        13.8
      ]
    ],
    "aspectRatio": 0.8571428571428571
  },
  {
    "name": "An open horizon",
    "place": "Where rivers meet the sea",
    "start": 19,
    "end": 24,
    "image": "regions/horizon.jpg",
    "description": "Open estuary, layered hills, garden and distant sea",
    "nodes": [
      [
        21,
        84.5
      ],
      [
        44.5,
        65.7
      ],
      [
        64,
        52.7
      ],
      [
        84,
        39.3
      ],
      [
        51,
        27.7
      ],
      [
        24,
        13.8
      ]
    ],
    "aspectRatio": 0.8571428571428571
  },
  {
    "name": "A world of wonder",
    "place": "Orchards and shared courtyards",
    "start": 25,
    "end": 30,
    "image": "regions/wonder.jpg",
    "description": "Terraced orchards, a market awning, meal shelter and seedling garden",
    "nodes": [
      [
        21,
        84.5
      ],
      [
        44.5,
        65.7
      ],
      [
        64,
        52.7
      ],
      [
        84,
        39.3
      ],
      [
        51,
        27.7
      ],
      [
        24,
        13.8
      ]
    ],
    "aspectRatio": 0.8571428571428571
  },
  {
    "name": "Growing in grace",
    "place": "Gardens and the workshop",
    "start": 31,
    "end": 38,
    "image": "regions/grace.jpg",
    "description": "Cultivated gardens, pottery shelter, mountains and an open workshop",
    "nodes": [
      [
        29.5,
        87
      ],
      [
        66.7,
        76
      ],
      [
        33.6,
        65.3
      ],
      [
        70.7,
        54.8
      ],
      [
        35.2,
        43.2
      ],
      [
        70.9,
        33.2
      ],
      [
        35.6,
        23
      ],
      [
        72,
        13.6
      ]
    ],
    "aspectRatio": 0.75
  }
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
