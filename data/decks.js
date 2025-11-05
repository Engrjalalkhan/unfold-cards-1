// Zones-based structure with categories (like Netflix genres)
export const zones = [
  {
    id: 'relationship-zone',
    name: 'Relationship Zone',
    color: '#FF6B6B',
    categories: [
      { id: 'couple-questions', name: 'Couple Questions', color: '#FF6B6B', questions: [
        'What first drew you to me?',
        'When did you feel most loved by me?',
        'What’s one ritual we should start together?',
        'What helps you feel heard in tough moments?',
        'What’s your favorite tiny detail about us?',
      ]},
      { id: 'for-soulmates', name: 'For Soulmates', color: '#FF8E8E', questions: [
        'What does “soulmate” mean to you?',
        'What moment felt like fate for us?',
        'Where do you feel most connected to me?',
        'What do you hope never changes between us?',
        'What truth about love have we learned together?',
      ]},
      { id: 'couple-therapy', name: 'Couple Therapy', color: '#E85656', questions: [
        'How can we repair faster after conflict?',
        'Which boundary helps us feel safe?',
        'What communication pattern should we retire?',
        'Where do we need more clarity?',
        'What support feels most nourishing right now?',
      ]},
      { id: 'naughty-nights', name: 'Naughty Nights', color: '#FF3D71', questions: [
        'What playful fantasy feels exciting to explore?',
        'What makes you feel most desired?',
        'What turns chemistry into intimacy for you?',
        'What’s a spicy surprise you’d enjoy?',
        'What’s a soft “no” you want respected?',
      ]},
      { id: 'the-future-us', name: 'The Future Us', color: '#FA5252', questions: [
        'Where do you imagine us in five years?',
        'What’s an adventure you want us to plan?',
        'What values guide our future decisions?',
        'What home feels right for us?',
        'What legacy do we want to build?',
      ]},
    ],
  },
  {
    id: 'friendship-zone',
    name: 'Friendship Zone',
    color: '#4D96FF',
    categories: [
      { id: 'for-best-friends', name: 'For Best Friends', color: '#4D96FF', questions: [
        'What memory with me always makes you smile?',
        'What’s a tradition we should start?',
        'How can we show up better for each other?',
        'What’s a challenge you overcame recently?',
        'What adventure should we plan next?',
      ]},
      { id: 'spill-the-tea', name: 'Spill the Tea', color: '#5AA0FF', questions: [
        'What’s your most chaotic story you can share?',
        'What’s a hot take you stand by?',
        'Who’s the funniest person we know and why?',
        'What trend should be canceled forever?',
        'What rumor did you believe for too long?',
      ]},
      { id: 'confessions', name: 'Confessions', color: '#3C88F7', questions: [
        'What’s a harmless secret you’ve never told me?',
        'What’s a time you pretended to know something?',
        'What made you cringe in hindsight?',
        'What lie did you tell for a good reason?',
        'What’s a habit you’re trying to break?',
      ]},
      { id: 'getting-to-know-you', name: 'Getting to Know You', color: '#6FAEFF', questions: [
        'What’s your comfort movie and why?',
        'Which city feels like your vibe?',
        'What’s a skill you want to master?',
        'Morning person or night owl—why?',
        'What food tells your life story?',
      ]},
      { id: 'random-mix', name: 'Random Mix', color: '#2F7CF0', questions: [
        'If you had a theme song, what is it?',
        'What’s your chaotic superpower?',
        'Pick a color—what mood does it give?',
        'What tiny joy brightened your week?',
        'What’s the weirdest compliment you’ve received?',
      ]},
    ],
  },
  {
    id: 'family-zone',
    name: 'Family Zone',
    color: '#00C897',
    categories: [
      { id: 'for-siblings', name: 'For Siblings', color: '#00C897', questions: [
        'What childhood memory do you think I forgot?',
        'What made our bond stronger over time?',
        'What silly rivalry should we revive?',
        'Which family rule was secretly good?',
        'What tradition should we keep alive?',
      ]},
      { id: 'deep-questions', name: 'Deep Questions', color: '#00DEAE', questions: [
        'What value defines our family best?',
        'What truth shaped you most?',
        'What boundary improved our relationships?',
        'How do we communicate at our best?',
        'What do you want the next gen to inherit?',
      ]},
      { id: 'the-past', name: 'The Past', color: '#00B69B', questions: [
        'Which ancestor are you curious about?',
        'What old story is worth retelling?',
        'What tradition do you miss?',
        'What place feels like home forever?',
        'What lesson did the past teach you?',
      ]},
    ],
  },
  {
    id: 'emotional-zone',
    name: 'Emotional Zone',
    color: '#9D4EDD',
    categories: [
      { id: 'dream-talks', name: 'Dream Talks', color: '#9D4EDD', questions: [
        'What dream keeps returning?',
        'What’s a bold goal you’re nurturing?',
        'Where do you want more wonder?',
        'What would future-you thank you for?',
        'What small step feels brave?',
      ]},
      { id: 'late-night-talks', name: 'Late Night Talks', color: '#B07AED', questions: [
        'What truth is easier to say at night?',
        'Where do you feel most vulnerable?',
        'What do you need more of lately?',
        'What fear turned into wisdom?',
        'What calms your mind at 2 a.m.?',
      ]},
      { id: 'toxic-truths', name: 'Toxic Truths', color: '#8A3CE0', questions: [
        'What pattern are you unlearning?',
        'What boundary protects your peace?',
        'Where did you abandon yourself?',
        'What red flag do you ignore?',
        'What apology do you owe yourself?',
      ]},
      { id: 'long-distance-vibes', name: 'Long Distance Vibes', color: '#7A2FD8', questions: [
        'What helps you feel close from afar?',
        'What ritual keeps us connected?',
        'How do we celebrate wins together?',
        'What do you need during tough weeks?',
        'What plan excites you next?',
      ]},
    ],
  },
  {
    id: 'fun-zone',
    name: 'Fun Zone',
    color: '#FFC300',
    categories: [
      { id: 'would-you-rather', name: 'Would You Rather', color: '#FFC300', questions: [
        'Be fluent in all languages or talk to animals?',
        'Teleport anywhere or time-travel once?',
        'Never run out of coffee or snacks?',
        'Live in a treehouse or a houseboat?',
        'Always arrive early or never wait again?',
      ]},
      { id: 'juicy-convos', name: 'Juicy Convos', color: '#FFCF53', questions: [
        'Best date idea you’ve never tried?',
        'What’s your iconic pickup line?',
        'Most chaotic text you sent?',
        'Your go-to flirty compliment?',
        'Wild party story—PG-13 edition?',
      ]},
      { id: 'spicy-edition', name: 'Spicy Edition', color: '#FFB703', questions: [
        'What’s a cheeky dare you’d accept?',
        'Sweet talk or bold moves—what’s your style?',
        'What’s your irresistible vibe?',
        'What playful line always works?',
        'Hard pass: what’s a no-go for you?',
      ]},
    ],
  },
];

export const allCategories = zones.flatMap(z => z.categories);
export const getCategoryById = (id) => allCategories.find(c => c.id === id);