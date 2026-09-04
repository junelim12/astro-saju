/**
 * Zodiac sign descriptions — used for the Sun / Moon / Rising cards.
 * Keys: English sign name (e.g. "Virgo")
 */

export const SUN_SIGN_DESCRIPTIONS: Record<string, string> = {
  Aries:
    "You've got the heart of a trailblazer who never hesitates to go first. Taking the road no one else has taken — and winning — is how you prove to yourself that you matter.",
  Taurus:
    "You're focused on building real, lasting stability and enjoying life's sensory pleasures along the way. You don't rush; steady, patient effort at your own pace is how you get results that last.",
  Gemini:
    "You love collecting knowledge and information from every corner of the world and sharing it with everyone you meet. You adapt effortlessly to changing environments, and your curiosity never runs dry.",
  Cancer:
    "Building a warm, protective circle around the people you love is what drives you. Your deep empathy lets you care for everyone around you, and you draw real strength from emotionally close relationships.",
  Leo:
    "You're the main character who wants to stand at the center of the world in your own unique light. Your natural creativity and confidence spread positive energy everywhere you go, and you burn brightest when you're recognized.",
  Virgo:
    "You find order in a chaotic world and take real satisfaction in doing things right. With sharp analysis and a practical eye, you're the fixer who makes everything around you just a little better.",
  Libra:
    "You're skilled at finding harmony between opposing forces and striking a balance where everyone wins. With refined taste and manners, you're drawn to relationships built on fairness and reason.",
  Scorpio:
    "You see straight through the surface to what's actually true, and you go all-in on what matters most in life. Once you commit to something, you follow it all the way through — a strategist with fierce willpower and remarkable resilience.",
  Sagittarius:
    "You're a free spirit endlessly exploring the deeper meaning of life while chasing a bigger world. Optimistic and unafraid of long odds, you expand who you are through new knowledge and adventure.",
  Capricorn:
    "Like a climber working a mountain one step at a time, you move steadily toward concrete goals. Strong discipline and a real sense of responsibility make you the kind of leader who turns ambition into results.",
  Aquarius:
    "You see the future before everyone else and refuse to be boxed in by convention. Driven by a sense of humanity and fairness, you dream of a better collective future while staying unmistakably, unapologetically yourself.",
  Pisces:
    "You move freely between reality and imagination, extending boundless compassion to everything around you. Intuitive and deeply inspired, your artistic sensitivity has a way of making the world a little more beautiful.",
};

export const MOON_SIGN_DESCRIPTIONS: Record<string, string> = {
  Aries:
    "You feel at peace when your wants are stated plainly and met right away. You're most comfortable being yourself when you can throw yourself into something you care about without worrying what anyone thinks.",
  Taurus:
    "You need a dependable environment that satisfies the senses — good food, soft textures, financial breathing room. Real emotional stability only comes from a predictable routine with little sudden change.",
  Gemini:
    "You feel reassured when you can talk through what's on your mind or take in something new. Boredom is hard for you to sit with, and you come alive emotionally when you're intellectually stimulated.",
  Cancer:
    "You need relationships that feel like family — where your emotional waves are fully understood and you're loved without conditions. Caring for someone, or being cared for, is how you find your inner calm.",
  Leo:
    "You feel emotionally full when you're treated as someone special and given generous praise. Underneath it all you can be as pure as a kid, and you're happiest at the center of genuine affection.",
  Virgo:
    "You feel settled when your day-to-day is perfectly in order and you feel in control of your own life. Once you're sure you're useful to someone, the anxiety fades and your mind goes quiet.",
  Libra:
    "Staying in peaceful, conflict-free relationships matters most for your emotional health. Rather than being alone, you fill what's missing emotionally by talking things through with a partner who's on your wavelength.",
  Scorpio:
    "You crave deep, soul-level bonds over anything casual. You find real refuge in relationships built on trust, where secrets and intense feelings can be shared safely.",
  Sagittarius:
    "You feel comfortable knowing you're free to leave anytime, tied down by no one. Widening your perspective through new experiences is, for you, the best kind of emotional healing there is.",
  Capricorn:
    "You feel secure when things go according to plan and you're recognized as genuinely competent. Real results and authority protect your feelings better than any comforting words could.",
  Aquarius:
    "You need room to breathe — your own territory and time, even while belonging to a group. Wary of getting emotionally entangled, you feel a cool sense of ease in relationships built on intellectual connection.",
  Pisces:
    "You recharge by stepping away from the noise of reality into solitude, imagination, or art. Your boundless empathy means you can get swept up in other people's emotions, but meditation helps you find your inner peace again.",
};

export const RISING_SIGN_DESCRIPTIONS: Record<string, string> = {
  Aries:
    "Bright eyes and quick movement give you an energetic first impression wherever you go. Your straightforward, confident manner earns you a reputation as someone \"upfront and full of passion\" the moment people meet you.",
  Taurus:
    "You give off a calm, unhurried air, and there's a quiet weight and polish to everything you say and do. People sense stability and trustworthiness around you and read you as solid, unlikely to change on a whim.",
  Gemini:
    "A sharp, curious expression is part of your charm, along with an easy energy that lets you strike up conversation with anyone instantly. Your quick wit and sharp instincts earn you a reputation as \"clever and versatile.\"",
  Cancer:
    "Soft features and kind eyes have a way of putting even total strangers at ease. Your warm, caring vibe means people remember you as someone \"comforting and genuinely thoughtful.\"",
  Leo:
    "Without even trying, you carry a dignified presence and bold energy that stands out in any crowd. Your confident manner and bright laugh give you a magnetic charisma that takes over the room.",
  Virgo:
    "A put-together look and composed posture give off an intelligent, careful impression. Your polite, analytical demeanor earns you a reputation as \"a meticulous, disciplined professional.\"",
  Libra:
    "Balanced style and gracious manners give you a polished image that people naturally warm to. Your smooth way with words and social ease leave people thinking \"refined and easy to get along with.\"",
  Scorpio:
    "You give off a mysterious, intense aura that doesn't give much away, which only makes people more curious. Your penetrating gaze reads as hard-to-approach but undeniably magnetic at the same time.",
  Sagittarius:
    "An easygoing expression and big, easy laugh signal an optimistic, adventurous streak. Your free-spirited energy — allergic to being boxed in — tends to bring everyone around you along for the fun.",
  Capricorn:
    "You come across as more mature and composed than your actual age, with a strict but trustworthy, authoritative presence. Responsible speech and careful action leave people thinking \"grown-up and dependable.\"",
  Aquarius:
    "Rather than following trends, you stick to your own distinct style, giving off a cool, rational vibe. Your unconventional attitude earns you a reputation as \"original and a deep thinker.\"",
  Pisces:
    "You have a dreamy, gentle gaze with a faintly artistic or mysterious air about you. A strange, disarming warmth makes people describe you as \"sensitive and dreamlike.\"",
};

/** Tropical order: Aries(0) – Pisces(11) — used for Moon/Rising sign index mapping */
export const ZODIAC_SIGNS_BY_INDEX: readonly string[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;
