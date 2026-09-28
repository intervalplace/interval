// Shared header: nav, marking the current page.
//
// ---- THE GUIDE AND THE MANUAL CAME OFF THE BAR ----
//
// Not deleted: demoted to the foot of the page, beside the source, where the
// people who want them will find them and nobody else has to step over them.
//
// The reason is not room on a phone, it is what a bar full of documentation
// SAYS. A world whose front door offers a manual is telling you it needs
// explaining, and explaining spends the one thing this world has that the
// others do not -- "even a manual and explaining everything takes away the
// sense of exploring too doesn't it". The front page argues, the world is
// entered, and the reading is there for anybody who goes looking.
//
// AND "the long version" BECAME "the handbook", because it is not a long
// version of anything any more. What that link used to open was a web manual,
// which is a wiki with better manners: you hit a wall, you search the page,
// you get the answer, and nothing was learned. It opens a book to print now.
// Once it is paper it cannot be searched, which is the whole of the point.
//
// Six doors, short words. "New Player Guide" was the widest
// thing on the bar by a distance and the file behind it is called quickstart;
// Source moved to the foot of every page, where the same link already lived.
// Six long labels wrapped to three rows on a phone and took a third of the
// screen before the world's own name appeared.
document.body.insertAdjacentHTML('afterbegin', `
<div class="page">
  <nav class="stone">
    <a href="/">Interval</a>
    <a href="/play">Play</a>
    <a href="/hiscores">Hiscores</a>
    <a href="/board">Board</a>
    <a href="/map">Map</a>
  </nav>
</div>`)
const here = location.pathname.replace(/\/$/, '') || '/'
document.querySelectorAll('nav a').forEach(a => {
  if (a.getAttribute('href') === here) a.classList.add('here')
})

// The source belongs at the end of the reading, not the top of it. This script
// runs at the START of <body>, so appending immediately put the footer directly
// under the nav: at that moment there was nothing else in the document to be
// below. Wait for the page to exist first.
function addFootLink() {
  document.body.insertAdjacentHTML('beforeend', `
<div class="page">
  <p class="footlink">
    <a href="/quickstart">how to begin</a> &middot;
    <a href="/manual">the handbook</a> &middot;
    <a href="/download">the window</a><br>
    the world's constitution and every line that runs it:
    <a href="https://github.com/intervalplace/interval" id="ghlink">github.com/intervalplace/interval</a></p>
</div>`)
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addFootLink, { once: true })
} else addFootLink()
