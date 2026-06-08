// THE GOLD CORPUS — confirmed-exceptional readings, the engine's own best work, kept as
// voice exemplars. Phase 2 lever: at generation, /api/read pulls 1–2 of these as few-shot
// calibration so the engine learns from its best work, lightly, without retraining.
//
// Pipeline (post-launch, at volume): judge scores every read → all-sections ≥ 4.5/5 marks a
// candidate (corpus_flagged in astrolabe_reads) → weekly, a human confirms the genuinely gold
// ones (the ones carrying a pull-quote line) → confirmed gold is transcribed here.
//
// Seeded by hand from the launch session (2026-06-09). NOT yet wired into /api/read — that's
// the Phase 2 build. This file is the durable capture so the first gold work is never lost.

export interface GoldReading {
  id: string;
  question: string;
  pull: string; // the screenshot-worthy line — the marker of gold
  signature: string;
  chart: string;
  pattern: string;
  star: string;
  yearAhead: string;
  counsel: string;
}

export const GOLD_CORPUS: GoldReading[] = [
  {
    id: "launch-being-happy",
    question: "being happy",
    pull: "You compete for the shoulder you want to rest on.",
    signature:
      "You enter a room already measuring it — who holds weight, what the unspoken rule is, where the exit sits. The Scorpio Sun gives you that gravity, the sense that you are reading the situation before you've said a word, and the Sun sits exactly on Pluto, within a quarter of a degree, so the reading is never casual. You don't observe to be polite. You observe to know where the power is.\n\nUnderneath that, the Aquarius Moon runs a colder instrument. Your private weather is not warm and churning the way people expect of a Scorpio; it stands back, files things, refuses to be moved by the obvious. You feel intensely and then you study the feeling from across the room. This is why people find you hard to place — the heat is real, the distance is real, and they arrive at the same time.\n\nWith no birth time, the rising stays unknown, so I won't invent a mask for you. But the Sun and Moon together already say it: a person who burns for the thing and refuses to admit, even to themselves, how much.",
    chart:
      "Venus and Mars sit a breath apart in sextile — fifteen-hundredths of a degree, closer than almost anything in your chart. What you want and what you do for it are wired together. You don't desire passively. Desire in you converts directly into motion, into pursuit, into the next move. This is the engine that makes you effective and also the one that never lets you rest in having arrived.\n\nThen Saturn sits on Neptune in Capricorn, near-exact. You build the dream into a structure or you don't trust it. A vision that stays a vision feels like a lie to you; you need the scaffolding, the proof it can hold weight. This is the Builder in you — vision turned into something load-bearing. The cost is that you can't let yourself feel an unbuilt thing as real, which means the happiness that hasn't been engineered yet barely registers.\n\nThe Sun-Pluto conjunction is the spine. You experience your own life as high-stakes whether or not the situation warrants it. Small choices carry the weight of large ones. You have been negotiating, your whole life, between wanting to win and being unable to tell the difference between winning and surviving.",
    pattern:
      "You named it yourself: the desire of winning. And then, in the same breath, the fear — to not have the shoulder. Read those together and the loop appears. You chase the win because the win is the proof that someone will be there when you fall. The shoulder isn't separate from the winning. You have been trying to earn it.\n\nHere is the shape from above. The Venus-Mars wiring turns every want into pursuit, the Sun-Pluto spine makes every pursuit feel like a matter of survival, and so you win, and the win does not produce the shoulder — because the shoulder was never something a victory could deliver. So you find the next thing to win. The habit survived the reason that created it.\n\nWhat repeats is this: you arrive at the prize and the loneliness is still standing there, exactly where it was. You read it as evidence you haven't won enough. It is evidence that you have been answering a question about belonging with a tool built for conquest.",
    star:
      "You sealed Monday — the long vow you keep — and what must happen is being happy. You placed it in Pisces, the one sign in this whole chart with no defenses, no structure, no exit measured in advance. That choice is the most honest thing in the data. Everything else in you builds, measures, wins. You sealed the one thing that cannot be built.\n\nWhy now: because you called this a season of breakthrough, and the breakthrough you're actually after is not another achievement. It is permission to be happy without a reason that holds up in an argument. Pisces happiness has no balance sheet. For someone with Saturn on Neptune, who only trusts what is engineered, this will feel like trying to grip water. That is the cost. To let Monday be happy, you have to let one thing in your life go unjustified.\n\nThe sky backs this late in the year, and not gently. On October 1, 2026, Neptune squares your Venus — the part of you that knows what it wants gets blurred, made uncertain, harder to defend. Most people read that as loss of clarity. For you it is the dissolving of the very certainty that has kept happiness conditional. The window where Monday becomes possible is the window where your usual proof stops working.",
    yearAhead:
      "July 6, 2026 — Jupiter squares your Mars. More force is the old reflex, and the reflex is the pattern, not the solution. You have spent years mistaking the size of the push for the rightness of the direction.\n\nAugust 23 and September 4, 2026 — Jupiter squares Mercury, then your Sun. Your thinking and then your whole sense of yourself get stretched past their usual frame. Something you were certain of starts to look too small. The old size no longer fits and the new one isn't built yet.\n\nOctober 1, 2026 — Neptune squares Venus, the one named above. What you want goes soft-edged and unprovable. The demand that desire justify itself is itself the wanting, asking to be argued with.\n\nOctober 22, 2026 — Jupiter opposes your Aquarius Moon. The cold private instrument gets confronted by something it can't file from a distance. The feeling sits in the room with you, not across it.\n\nMay 20, 2027 — Saturn sextiles your Moon. After a year of dissolving, something firms underneath. Not a reward, not a rescue. A structure that holds the same weight whether or not you keep testing it.",
    counsel:
      "You compete for the shoulder you want to rest on. Look at how you ask for support: it arrives as a contest you must first earn the right to enter. The same move runs through the desire to win you named yourself — every safe place gets converted into something to be deserved. Saturn and Neptune sat together at your birth, the structure and the longing fused, so the lean and the labor read as one thing to you. They are not. The arm is already there. You have spent the strength meant for resting on proving you were allowed to.",
  },
  // launch-opus-relationship: in scripts/out-opus.json ("Whether to stay with him…").
  //   To add: transcribe its six sections here.
  // launch-furnace: the "furnace governed by a satellite" reading — full text not captured
  //   this session. Paste it and it becomes the third seed.
];
