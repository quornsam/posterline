# Posterline

A simple browser game: guess the movie from one-pixel-wide slices of its poster.

## Run it

Upload the whole `Posterline` folder to GitHub, or put its contents at the root of a GitHub Pages repository.

Because the game loads `movies.json`, opening `index.html` directly as a `file://` URL may be blocked by your browser. GitHub Pages works normally.

## Add posters

Put your poster images in the `posters` directory.

Posterline already knows the 50 movie titles in `movies.json`. It tries four extensions automatically:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

For example, *Jurassic Park* can be any one of:

- `posters/jurassic-park.jpg`
- `posters/jurassic-park.jpeg`
- `posters/jurassic-park.png`
- `posters/jurassic-park.webp`

Use the **POSTER LIBRARY** button in the game to scan the folder and see exactly which images are present or missing.

## Gameplay

- Press **START**.
- One random horizontal or vertical one-pixel line from the hidden poster is revealed.
- Choose a title, or press **NEXT LINE**.
- A wrong guess automatically reveals another line.
- Correct answers reveal the full poster.
- Scoring starts at 100 points and falls by 5 for each additional line, with a minimum of 5 points.
- **PASS** reveals the answer with no points.

## Poster image rights

The code does not include copyrighted movie poster artwork. If you publish the game, make sure you have the right to redistribute the poster images you add.
