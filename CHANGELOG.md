# Changes

## IvanaFin 1.1.0 - what's new

Three rounds of testing on every client (Fire TV, Samsung, LG and Jellyfin web) since 1.0.0. Everything found has been fixed.

### Ratings
- The star rating is now the TMDB rating everywhere: Discover, Discover title pages, film pages and show pages all show the same number.
- The Rotten Tomatoes score with the tomato symbol is shown next to it on Discover, on Discover title pages and on show pages (film pages already had it).
- Discover's header now uses each title's up-to-date rating (it could differ from the title page before).
- Discover shows the Rotten Tomatoes score at the same time as the rest of the line (it used to appear a moment later).

### Discover
- A title marked "available" that is no longer in your library opens its Discover page instead of an error page (Fire TV).
- Fire TV: Back from a title opened from "Recommended" puts the right background picture back.
- Fire TV: the Discover search and the main Search results can always be reached with the remote after typing.
- Fire TV: Back from Discover selects the Discover button on Home (it selected Search).
- Up from the Discover search box goes to the tabs (Fire TV).
- Search results no longer show through under the Discover search box, and long header text ends cleanly with "..." (web).

### Music
- Searching an artist now also lists their albums and songs (before, only the artist was found).
- A song started from Music Search queues the rest of its album, so Next and Up next work.
- Fire TV: the search box keeps its text with its results after Back.
- Back from Now Playing selects the song that is playing now.
- Next and Previous while paused start the song (Fire TV).
- Up next rows use the full width, with song lengths at the right like album lists.
- Song menu (hold OK) has Go to album and Go to artist (Fire TV).
- The Lyrics button shows a dot while lyrics are on.
- The Home / Search / Your Library tabs stay readable over bright artist photos; artist photos are darker under the tabs.
- Your Library: the selected tab is readable on web; LG: Down from the tabs goes to the first album.
- "Mixtapes Mix" name no longer wraps.
- Play, Pause, Stop, Fast forward and Rewind remote keys work in Music on Samsung and LG.
- Play next has its own icon in menus (Fire TV).

### Films, shows and Star Wars
- Show pages: the line under each episode (length, rating, "Ends at") lines up across a row (web, Samsung, LG).
- Show pages remember the season you picked; on Fire TV the Season button stays selected after picking a season.
- Episode ratings use the gold star; Cast & Crew lines up with the episodes.
- Selected posters in film/show page rows are no longer cut off at the top.
- Star Wars: Down from the Order button goes to the first poster (Samsung, LG).
- Picture-based (PGS) subtitles show straight away again (the server burns them in).
- Web player: clicking the hidden Back arrow brings the controls back instead of pausing.

### Samsung TV
- Text boxes (Search, Discover search, sign-in) no longer pop the on-screen keyboard just by being selected - press OK to type, Up/Down move on.
- Search result names line up with their posters.

### Jellyfin web
- Phone-sized screens (the Jellyfin phone app) get a phone layout on film, show, library and Music pages.

### Fire TV
- Settings > Home Screen Libraries: the selected row no longer grows under the arrow buttons.
