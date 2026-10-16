# Expanded Nanak rewards prototype

The wardrobe has Clothing, Belongings and Actions tabs. Selecting an item opens a phone sheet with the character preview, its unlock requirement and a confirmation button. Previewing never spends coins or changes equipped items. Unlock and equip is one atomic state transition. Owned items can be equipped again free. Equipping replaces only the corresponding slot.

## Collection

| Slot | Item | Unlock |
| --- | --- | --- |
| Clothing | Everyday explorer | Free |
| Clothing | Garden embroidery | 30 coins |
| Belongings | Travel light | Free |
| Belongings | Journey satchel | 20 coins |
| Belongings | Explorer's journal | Complete one pauri with at least one star |
| Belongings | Rabab | Finish the music and companionship story |
| Belongings | Seva basket | Finish the seva story |
| Actions | Ready to explore | Free |
| Actions | A warm welcome | 20 coins |
| Actions | Listening closely | Complete one pauri with at least one star |
| Actions | Ready to help | Finish the seva story |

The existing 10 coins per newly earned star remains unchanged. Both characters share ownership and equipment. Original outfits and identity elements remain free. No quality such as compassion is scored or sold.

## Review flow

Open Kids Mode, then Rewards. The Try rewards with 60 demo coins button starts an isolated, temporary wardrobe with a sample completed pauri. Buy the outfit and satchel, try the insufficient-balance state, finish a short story to unlock an item for free, and tap the character to preview an action. Return to my rewards restores the real saved wardrobe. Leaving the screen discards the temporary demo.

Normal ownership, equipment and read stories persist in the existing version-1 browser save. Saves without a wardrobe receive free defaults without losing coins, stars or legacy frames. The parser checks item IDs, unique ownership and valid equipment slots. A production backend must enforce entitlement and transactions independently.

## Visual scope

Garden embroidery has separate generated artwork for Prem Singh and Sehaj Kaur. Belongings appear as accompanying item symbols beside the character. Actions are simple React Native Animated position/rotation previews, with reduced-motion support. Articulated hand motion, carried-object rigs, real instrument audio and community activity scenes remain future production work. The journal is an equipable reward, not a new journal-writing feature.

## Story sources

- Music and companionship: [Darbar, Guru Nanak's Message of Peace through Music](https://darbar.org/wp-content/uploads/2026/04/Guru-Nanaks-Message-of-Peace-through-Music-Programme-Bookles.pdf).
- Seva: [Sikh Coalition, Beliefs](https://www.sikhcoalition.org/about-sikhs/beliefs/).

Stories are brief prototype paraphrases with optional reflection. No response is recorded. Text and artwork need Khalis review before production. The rewards do not claim to depict historical objects or locations accurately.

## Implementation

wardrobe.ts owns the catalog, eligibility, purchase/equip transitions and storage validation. RewardsScreen.tsx owns preview and demo state. ExplorerPreview.tsx renders the selected artwork, item symbol and action. Browser icon/image adapters remain outside shared components. Existing native source and protected phone runtime are unchanged.
