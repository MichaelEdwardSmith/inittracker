<!-- Full-screen Quick Rules reference for DMs. Left column lists categories;
     right panel shows the selected category's content. -->
<script lang="ts">
	let {
		onclose,
		ruleset = '2014'
	}: {
		onclose: () => void;
		ruleset?: '2014' | '2024';
	} = $props();

	type Category = {
		id: string;
		label: string;
		icon: string;
	};

	const categories: Category[] = [
		{ id: 'checks', label: 'Ability Check DCs', icon: '🎲' },
		{ id: 'actions', label: 'Actions in Combat', icon: '⚔️' },
		{ id: 'bonus', label: 'Bonus Actions', icon: '⚡' },
		{ id: 'saves', label: 'Common Save DCs', icon: '💀' },
		{ id: 'concentration', label: 'Concentration', icon: '🧠' },
		{ id: 'conditions', label: 'Conditions', icon: '🩸' },
		{ id: 'cover', label: 'Cover', icon: '🛡️' },
		{ id: 'death', label: 'Death Saving Throws', icon: '☠' },
		{ id: 'xp', label: 'Encounter Difficulty', icon: '⚖️' },
		{ id: 'exhaustion', label: 'Exhaustion', icon: '😓' },
		{ id: 'light', label: 'Light & Vision', icon: '👁️' },
		{ id: 'magic', label: 'Magic & Casting', icon: '✨' },
		{ id: 'items', label: 'Magic Items List', icon: '🔮' },
		{ id: 'movement', label: 'Movement & Position', icon: '👣' },
		{ id: 'resting', label: 'Resting', icon: '🌙' },
	];

	let selected = $state('actions');

	// ── Magic Items List ─────────────────────────────────────────────────────
	type MagicItem = {
		name: string;
		source: string;
		page: number;
		type: string;
		rarity: string;
		attunement: string;
		cost: string;
		description: string;
	};

	const magicItems: MagicItem[] = [
		// ARMOR
		{ name: 'Adamantine Armor', source: 'DMG', page: 150, type: 'Armor', rarity: 'Uncommon', attunement: 'No attunement', cost: '500 gp', description: 'Suit of armor made from adamantine. While wearing it, any critical hit against you becomes a normal hit.' },
		{ name: 'Animated Shield', source: 'DMG', page: 151, type: 'Armor', rarity: 'Very Rare', attunement: 'Yes (shield)', cost: '6,000 gp', description: 'While holding this shield, you can speak its command word as a bonus action to animate it. The shield floats in your space to protect you as if you were wielding it, while your hands remain free. The shield remains animated for 1 minute, until you use a bonus action to end this effect, or until you are incapacitated or die, at which point the shield falls to the ground or into your hand if you have one free.' },
		{ name: 'Armor of Invulnerability', source: 'DMG', page: 152, type: 'Armor', rarity: 'Legendary', attunement: 'Yes', cost: '50,000 gp', description: 'You have resistance to nonmagical damage while you wear this armor. Additionally, you can use an action to make yourself immune to nonmagical damage for 10 minutes or until you are no longer wearing the armor. Once this special action is used, it can\'t be used again until the next dawn.' },
		{ name: 'Armor of Resistance', source: 'DMG', page: 152, type: 'Armor', rarity: 'Rare', attunement: 'Yes', cost: '1,500 gp', description: 'You have resistance to one type of damage while you wear this armor. The DM chooses the type or determines it randomly from: acid, cold, fire, force, lightning, necrotic, poison, psychic, radiant, or thunder.' },
		{ name: 'Armor of Vulnerability', source: 'DMG', page: 152, type: 'Armor', rarity: 'Rare', attunement: 'Yes (Cursed)', cost: '500 gp', description: 'While wearing this armor you have resistance to one of the following damage types: bludgeoning, piercing, or slashing. The DM chooses the type or determines it randomly. Curse: This armor is cursed. Attuning to it curses you until you are targeted by the remove curse spell or similar magic. While cursed, you have vulnerability to two of the three damage types associated with the armor (not the one to which it grants resistance).' },
		{ name: 'Arrow-Catching Shield', source: 'DMG', page: 152, type: 'Armor', rarity: 'Rare', attunement: 'Yes', cost: '1,500 gp', description: 'You gain a +2 bonus to AC against ranged attacks while you wield this shield. This bonus is in addition to the shield\'s normal bonus to AC. In addition, whenever an attacker makes a ranged attack against a target within 5 feet of you, you can use your reaction to become the target of the attack instead.' },
		{ name: 'Demon Armor', source: 'DMG', page: 165, type: 'Armor', rarity: 'Very Rare', attunement: 'Yes (Cursed)', cost: '6,000 gp', description: 'While wearing this armor, you can understand and speak Abyssal. In addition, the armor\'s clawed gauntlets turn unarmed strikes with your hands into magic weapons that deal slashing damage, with a +1 bonus to attack and damage rolls and a damage die of 1d8. Curse: Once you don this cursed armor, you can\'t doff it unless you are targeted by the remove curse spell or similar magic.' },
		{ name: 'Dragon Scale Mail', source: 'DMG', page: 165, type: 'Armor', rarity: 'Very Rare', attunement: 'Yes', cost: '8,000 gp', description: 'Dragon scale mail is made of the scales of one kind of dragon. Sometimes dragons collect their cast-off scales and gift them to humanoids. Other times, hunters carefully skin and preserve the hide of a dead dragon. In either case, dragon scale mail is highly valued. While wearing this armor, you gain a +1 bonus to AC, you have advantage on saving throws against the Frightful Presence and breath weapons of dragons, and you have resistance to one damage type determined by the kind of dragon that provided the scales.' },
		{ name: 'Dwarven Plate', source: 'DMG', page: 167, type: 'Armor', rarity: 'Very Rare', attunement: 'No', cost: '12,000 gp', description: 'While wearing this armor, you gain a +2 bonus to AC. In addition, if an effect moves you against your will along the ground, you can use your reaction to reduce the distance you are moved by up to 10 feet.' },
		{ name: 'Elven Chain', source: 'DMG', page: 168, type: 'Armor', rarity: 'Rare', attunement: 'No', cost: '4,000 gp', description: 'You gain a +1 bonus to AC while you wear this armor. You are considered proficient with this armor even if you lack proficiency with medium armor.' },
		{ name: 'Glamoured Studded Leather', source: 'DMG', page: 172, type: 'Armor', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'While wearing this armor, you gain a +1 bonus to AC. You can also use a bonus action to speak the armor\'s command word and cause the armor to assume the appearance of a normal set of clothing or some other kind of armor. You decide what it looks like, including color, style, and accessories, but the armor retains its normal bulk and weight. The illusory appearance lasts until you use this property again or remove the armor.' },
		{ name: 'Mithral Armor', source: 'DMG', page: 182, type: 'Armor', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'Mithral is a light, flexible metal. A mithral chain shirt or breastplate can be worn under normal clothes. If the armor normally imposes disadvantage on Dexterity (Stealth) checks or has a Strength requirement, the mithral version of the armor doesn\'t.' },
		{ name: 'Plate Armor of Etherealness', source: 'DMG', page: 185, type: 'Armor', rarity: 'Legendary', attunement: 'Yes', cost: '60,000 gp', description: 'While you\'re wearing this armor, you can speak its command word as an action to gain the effect of the etherealness spell, which lasts for 10 minutes or until you remove the armor or use an action to speak the command word again. This property of the armor can\'t be used again until the next dawn.' },
		{ name: 'Shield of Missile Attraction', source: 'DMG', page: 200, type: 'Armor', rarity: 'Rare', attunement: 'Yes (Cursed)', cost: '1,500 gp', description: 'While holding this shield, you have resistance to damage from ranged weapon attacks. Curse: This shield is cursed. Attuning to it curses you until you are targeted by the remove curse spell or similar magic. Whenever a ranged weapon attack is made against a target within 10 feet of you, the curse causes you to become the target instead.' },
		{ name: 'Spellguard Shield', source: 'DMG', page: 201, type: 'Armor', rarity: 'Very Rare', attunement: 'Yes', cost: '10,000 gp', description: 'While holding this shield, you have advantage on saving throws against spells and other magical effects, and spell attacks have disadvantage against you.' },
		// POTIONS
		{ name: 'Potion of Animal Friendship', source: 'DMG', page: 187, type: 'Potion', rarity: 'Uncommon', attunement: '—', cost: '200 gp', description: 'When you drink this potion, you can cast the animal friendship spell (save DC 13) for 1 hour at will. Agitating this muddy liquid brings little bits into view: a fish scale, a hummingbird tongue, a cat claw, or a squirrel hair.' },
		{ name: 'Potion of Clairvoyance', source: 'DMG', page: 187, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '960 gp', description: 'When you drink this potion, you gain the effect of the clairvoyance spell. An eyeball bobs in this yellowish liquid but vanishes when the potion is opened.' },
		{ name: 'Potion of Climbing', source: 'DMG', page: 187, type: 'Potion', rarity: 'Common', attunement: '—', cost: '75 gp', description: 'When you drink this potion, you gain a climbing speed equal to your walking speed for 1 hour. During this time, you have advantage on Strength (Athletics) checks you make to climb. The potion is separated into brown, silver, and gray layers resembling bands of stone.' },
		{ name: 'Potion of Diminution', source: 'DMG', page: 187, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,000 gp', description: 'When you drink this potion, you gain the "reduce" effect of the enlarge/reduce spell for 1d4 hours (no concentration required). The red in the potion\'s liquid continuously contracts to a tiny bead and then expands again to color the clear liquid around it.' },
		{ name: 'Potion of Flying', source: 'DMG', page: 187, type: 'Potion', rarity: 'Very Rare', attunement: '—', cost: '7,500 gp', description: 'When you drink this potion, you gain a flying speed equal to your walking speed for 1 hour and can hover. If you\'re in the air when the potion wears off, you fall unless you have some other means of staying aloft.' },
		{ name: 'Potion of Gaseous Form', source: 'DMG', page: 187, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,000 gp', description: 'When you drink this potion, you gain the effect of the gaseous form spell for 1 hour (no concentration required) or until you end the effect as a bonus action. This potion\'s container seems to hold fog that moves and pours like water.' },
		{ name: 'Potion of Healing', source: 'DMG', page: 187, type: 'Potion', rarity: 'Common', attunement: '—', cost: '50 gp', description: 'You regain 2d4 + 2 hit points when you drink this potion. Whatever its potency, the potion\'s red liquid glimmers when agitated.' },
		{ name: 'Potion of Greater Healing', source: 'DMG', page: 187, type: 'Potion', rarity: 'Uncommon', attunement: '—', cost: '150 gp', description: 'You regain 4d4 + 4 hit points when you drink this potion.' },
		{ name: 'Potion of Superior Healing', source: 'DMG', page: 187, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,000 gp', description: 'You regain 8d4 + 8 hit points when you drink this potion.' },
		{ name: 'Potion of Supreme Healing', source: 'DMG', page: 187, type: 'Potion', rarity: 'Very Rare', attunement: '—', cost: '5,000 gp', description: 'You regain 10d4 + 20 hit points when you drink this potion.' },
		{ name: 'Potion of Heroism', source: 'DMG', page: 188, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,000 gp', description: 'For 1 hour after drinking it, you gain 10 temporary hit points that last for 1 hour. For the same duration, you are under the effect of the bless spell (no concentration required). This blue potion bubbles and steams as if boiling.' },
		{ name: 'Potion of Invisibility', source: 'DMG', page: 188, type: 'Potion', rarity: 'Very Rare', attunement: '—', cost: '5,000 gp', description: 'This potion\'s container looks empty but feels as though it holds liquid. When you drink it, you become invisible for 1 hour. Anything you wear or carry is invisible with you. The effect ends early if you attack or cast a spell.' },
		{ name: 'Potion of Mind Reading', source: 'DMG', page: 188, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,000 gp', description: 'When you drink this potion, you gain the effect of the detect thoughts spell (save DC 13). The potion\'s dense, purple liquid has an ovoid cloud of pink floating in it.' },
		{ name: 'Potion of Poison', source: 'DMG', page: 188, type: 'Potion', rarity: 'Uncommon', attunement: '—', cost: '100 gp', description: 'This concoction looks, smells, and tastes like a potion of healing or other beneficial potion. However, it is actually poison masked by illusion magic. An identify spell reveals its true nature. If you drink it, you take 3d6 poison damage, and you must succeed on a DC 13 Constitution saving throw or be poisoned. At the start of each of your turns while you\'re poisoned this way, you take 3d6 poison damage. At the end of each of your turns, you can repeat the saving throw. On a successful save, the poison damage you take on your subsequent turns decreases by 1d6. The poison ends when the damage decreases to 0.' },
		{ name: 'Potion of Resistance', source: 'DMG', page: 188, type: 'Potion', rarity: 'Uncommon', attunement: '—', cost: '300 gp', description: 'When you drink this potion, you gain resistance to one type of damage for 1 hour. The DM chooses the type or determines it randomly.' },
		{ name: 'Potion of Speed', source: 'DMG', page: 188, type: 'Potion', rarity: 'Very Rare', attunement: '—', cost: '5,000 gp', description: 'When you drink this potion, you gain the effect of the haste spell for 1 minute (no concentration required). The potion\'s yellow fluid is streaked with black and swirls on its own.' },
		{ name: 'Potion of Water Breathing', source: 'DMG', page: 188, type: 'Potion', rarity: 'Uncommon', attunement: '—', cost: '180 gp', description: 'You can breathe underwater for 1 hour after drinking this potion. Its cloudy green fluid smells of the sea and has a jellyfish-like bubble floating in it.' },
		{ name: 'Potion of Giant Strength (Hill)', source: 'DMG', page: 187, type: 'Potion', rarity: 'Uncommon', attunement: '—', cost: '200 gp', description: 'When you drink this potion, your Strength score changes to 21 for 1 hour. If your Strength is equal to or greater than 21, the potion has no effect. The Giant\'s type determines the Strength score. Hill Giant: 21.' },
		{ name: 'Potion of Giant Strength (Stone/Frost)', source: 'DMG', page: 187, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,000 gp', description: 'When you drink this potion, your Strength score changes to 23 for 1 hour (Stone or Frost Giant). If your Strength is already 23 or higher, the potion has no effect.' },
		{ name: 'Potion of Giant Strength (Fire)', source: 'DMG', page: 187, type: 'Potion', rarity: 'Rare', attunement: '—', cost: '1,200 gp', description: 'When you drink this potion, your Strength score changes to 25 for 1 hour (Fire Giant). If your Strength is already 25 or higher, the potion has no effect.' },
		{ name: 'Potion of Giant Strength (Cloud)', source: 'DMG', page: 187, type: 'Potion', rarity: 'Very Rare', attunement: '—', cost: '5,000 gp', description: 'When you drink this potion, your Strength score changes to 27 for 1 hour (Cloud Giant). If your Strength is already 27 or higher, the potion has no effect.' },
		{ name: 'Potion of Giant Strength (Storm)', source: 'DMG', page: 187, type: 'Potion', rarity: 'Legendary', attunement: '—', cost: '50,000 gp', description: 'When you drink this potion, your Strength score changes to 29 for 1 hour (Storm Giant). If your Strength is already 29 or higher, the potion has no effect.' },
		{ name: 'Potion of Vitality', source: 'DMG', page: 188, type: 'Potion', rarity: 'Very Rare', attunement: '—', cost: '5,000 gp', description: 'When you drink this potion, it removes any exhaustion you are suffering and cures any disease or poison affecting you. For the next 24 hours, you regain the maximum number of hit points for any Hit Die you spend. The potion\'s crimson liquid regularly pulses with dull light, calling to mind a heartbeat.' },
		// RINGS
		{ name: 'Ring of Animal Influence', source: 'DMG', page: 189, type: 'Ring', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'This ring has 3 charges, and it regains 1d3 expended charges daily at dawn. While wearing the ring, you can use an action to expend 1 of its charges to cast one of the following spells: animal friendship (save DC 13), fear (save DC 13, targeting only beasts that have an Intelligence of 3 or lower), or speak with animals.' },
		{ name: 'Ring of Djinni Summoning', source: 'DMG', page: 190, type: 'Ring', rarity: 'Legendary', attunement: 'Yes', cost: '60,000 gp', description: 'While wearing this ring, you can speak its command word as an action to summon a particular djinni from the Elemental Plane of Air. The djinni appears in an unoccupied space you choose within 120 feet of you. It remains as long as you concentrate (as if concentrating on a spell), to a maximum of 1 hour. It then returns to its home plane.' },
		{ name: 'Ring of Evasion', source: 'DMG', page: 191, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '5,000 gp', description: 'This ring has 3 charges, and it regains 1d3 expended charges daily at dawn. When you fail a Dexterity saving throw while wearing it, you can use your reaction to expend 1 of its charges to succeed on that saving throw instead.' },
		{ name: 'Ring of Feather Falling', source: 'DMG', page: 191, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '2,000 gp', description: 'When you fall while wearing this ring, you descend 60 feet per round and take no damage from falling.' },
		{ name: 'Ring of Free Action', source: 'DMG', page: 191, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '2,000 gp', description: 'While you wear this ring, difficult terrain doesn\'t cost you extra movement. In addition, magic can neither reduce your speed nor cause you to be paralyzed or restrained.' },
		{ name: 'Ring of Invisibility', source: 'DMG', page: 191, type: 'Ring', rarity: 'Legendary', attunement: 'Yes', cost: '75,000 gp', description: 'While wearing this ring, you can turn invisible as an action. Anything you wear or carry is invisible with you. You remain invisible until the ring is removed, until you attack or cast a spell, or until you use a bonus action to become visible again.' },
		{ name: 'Ring of Jumping', source: 'DMG', page: 191, type: 'Ring', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'While wearing this ring, you can cast the jump spell from it as a bonus action at will, but can target only yourself when you do so.' },
		{ name: 'Ring of Mind Shielding', source: 'DMG', page: 191, type: 'Ring', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing this ring, you are immune to magic that allows other creatures to read your thoughts, determine whether you are lying, know your alignment, or know your creature type. Creatures can telepathically communicate with you only if you allow it.' },
		{ name: 'Ring of Protection', source: 'DMG', page: 191, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '3,500 gp', description: 'You gain a +1 bonus to AC and saving throws while wearing this ring.' },
		{ name: 'Ring of Regeneration', source: 'DMG', page: 191, type: 'Ring', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'While wearing this ring, you regain 1d6 hit points every 10 minutes, provided that you have at least 1 hit point. If you lose a body part, the ring causes the missing part to regrow and return to full functionality after 1d6 + 1 days if you have at least 1 hit point the whole time.' },
		{ name: 'Ring of Resistance', source: 'DMG', page: 192, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '2,500 gp', description: 'You have resistance to one damage type while wearing this ring. The gem in the ring indicates the type, which the DM chooses or determines randomly.' },
		{ name: 'Ring of Shooting Stars', source: 'DMG', page: 192, type: 'Ring', rarity: 'Very Rare', attunement: 'Yes (outdoors at night)', cost: '15,000 gp', description: 'While wearing this ring in dim light or darkness, you can cast dancing lights and light from the ring at will. Casting either spell is an action. The ring has 6 charges for the following other properties. The ring regains 1d6 expended charges daily at dawn.' },
		{ name: 'Ring of Spell Storing', source: 'DMG', page: 192, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '5,000 gp', description: 'This ring stores spells cast into it, holding them until the attuned wearer uses them. The ring can store up to 5 levels worth of spells at a time. When found, it contains 1d6 − 1 levels of stored spells chosen by the DM.' },
		{ name: 'Ring of Spell Turning', source: 'DMG', page: 193, type: 'Ring', rarity: 'Legendary', attunement: 'Yes', cost: '80,000 gp', description: 'While wearing this ring, you have advantage on saving throws against any spell that targets only you (not in an area of effect). In addition, if you roll a 20 for the save and the spell is 7th level or lower, the spell has no effect on you and instead targets the caster, using the slot level, spell save DC, attack bonus, and spellcasting ability of the caster.' },
		{ name: 'Ring of Swimming', source: 'DMG', page: 193, type: 'Ring', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'You have a swimming speed of 40 feet while wearing this ring.' },
		{ name: 'Ring of Telekinesis', source: 'DMG', page: 193, type: 'Ring', rarity: 'Very Rare', attunement: 'Yes', cost: '25,000 gp', description: 'While wearing this ring, you can cast the telekinesis spell at will, but you can target only objects that aren\'t being worn or carried.' },
		{ name: 'Ring of the Ram', source: 'DMG', page: 193, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'This ring has 3 charges, and it regains 1d3 expended charges daily at dawn. While wearing the ring, you can use an action to expend 1 to 3 of its charges to attack one creature you can see within 60 feet of you. The ring produces a spectral ram\'s head and makes its attack roll with a +7 bonus.' },
		{ name: 'Ring of Warmth', source: 'DMG', page: 193, type: 'Ring', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'While wearing this ring, you have resistance to cold damage. In addition, you and everything you wear and carry are unharmed by temperatures as low as −50 degrees Fahrenheit.' },
		{ name: 'Ring of Water Walking', source: 'DMG', page: 193, type: 'Ring', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'While wearing this ring, you can stand on and move across any liquid surface as if it were solid ground.' },
		{ name: 'Ring of X-ray Vision', source: 'DMG', page: 193, type: 'Ring', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'While wearing this ring, you can use an action to speak its command word. When you do so, you can see into and through solid matter for 1 minute. This vision has a radius of 30 feet. To you, solid objects within that radius appear transparent and don\'t prevent light from passing through them.' },
		// RODS
		{ name: 'Immovable Rod', source: 'DMG', page: 175, type: 'Rod', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This flat iron rod has a button on one end. You can use an action to press the button, which causes the rod to become magically fixed in place. Until you or another creature uses an action to push the button again, the rod doesn\'t move, even if it is defying gravity. The rod can hold up to 8,000 pounds of weight. More weight causes the rod to deactivate and fall.' },
		{ name: 'Rod of Absorption', source: 'DMG', page: 195, type: 'Rod', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'While holding this rod, you can use your reaction to absorb a spell that is targeting only you and not with an area of effect. The absorbed spell\'s effect is canceled, and the spell\'s energy—not the spell itself—is stored in the rod. The energy has the same level as the spell when it was cast.' },
		{ name: 'Rod of Alertness', source: 'DMG', page: 196, type: 'Rod', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'This rod has a flanged head and the following properties. While holding the rod, you have advantage on Wisdom (Perception) checks and on rolls for initiative. The rod also functions as a magic weapon with a +1 bonus to attack rolls and damage rolls.' },
		{ name: 'Rod of Lordly Might', source: 'DMG', page: 196, type: 'Rod', rarity: 'Legendary', attunement: 'Yes', cost: '70,000 gp', description: 'This rod functions as a magic mace that grants a +3 bonus to attack and damage rolls made with it. The rod has properties associated with six different buttons that are set in a row along the haft.' },
		{ name: 'Rod of Rulership', source: 'DMG', page: 197, type: 'Rod', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'You can use an action to present the rod and command obedience from each creature of your choice that you can see within 120 feet of you. Each target must succeed on a DC 15 Wisdom saving throw or be charmed by you for 8 hours. While charmed in this way, the creature regards you as its trusted leader. If harmed by you or your companions, or commanded to do something contrary to its nature, a target ceases to be charmed in this way.' },
		{ name: 'Rod of Security', source: 'DMG', page: 197, type: 'Rod', rarity: 'Very Rare', attunement: 'No', cost: '12,000 gp', description: 'While holding this rod, you can use an action to activate it. The rod then instantly transports you and up to 199 other willing creatures you can see to a paradise that exists in an extraplanar space. This paradise can be a garden, a glade, an island, a palatial suite, or some other place of great beauty.' },
		{ name: 'Rod of the Pact Keeper +1', source: 'DMG', page: 197, type: 'Rod', rarity: 'Uncommon', attunement: 'Yes (Warlock)', cost: '400 gp', description: 'While holding this rod, you gain a +1 bonus to spell attack rolls and to the saving throw DCs of your warlock spells. In addition, you can regain one warlock spell slot as an action while holding the rod. You can\'t use this property again until you finish a long rest.' },
		{ name: 'Rod of the Pact Keeper +2', source: 'DMG', page: 197, type: 'Rod', rarity: 'Rare', attunement: 'Yes (Warlock)', cost: '2,000 gp', description: 'While holding this rod, you gain a +2 bonus to spell attack rolls and to the saving throw DCs of your warlock spells. In addition, you can regain one warlock spell slot as an action while holding the rod.' },
		{ name: 'Rod of the Pact Keeper +3', source: 'DMG', page: 197, type: 'Rod', rarity: 'Very Rare', attunement: 'Yes (Warlock)', cost: '10,000 gp', description: 'While holding this rod, you gain a +3 bonus to spell attack rolls and to the saving throw DCs of your warlock spells. In addition, you can regain one warlock spell slot as an action while holding the rod.' },
		// STAFFS
		{ name: 'Staff of Charming', source: 'DMG', page: 201, type: 'Staff', rarity: 'Rare', attunement: 'Yes (Bard/Cleric/Druid/Sorcerer/Warlock/Wizard)', cost: '4,000 gp', description: 'While holding this staff, you can use an action to expend 1 of its 10 charges to cast charm person, command, or comprehend languages from it using your spell save DC. The staff can also be used as a magic quarterstaff. The staff regains 1d8 + 2 expended charges daily at dawn.' },
		{ name: 'Staff of Fire', source: 'DMG', page: 201, type: 'Staff', rarity: 'Very Rare', attunement: 'Yes (Druid/Sorcerer/Warlock/Wizard)', cost: '12,000 gp', description: 'You have resistance to fire damage while you hold this staff. The staff has 10 charges. While holding it, you can use an action to expend 1 or more of its charges to cast one of the following spells from it, using your spell save DC: burning hands (1 charge), fireball (3 charges), wall of fire (4 charges).' },
		{ name: 'Staff of Frost', source: 'DMG', page: 202, type: 'Staff', rarity: 'Very Rare', attunement: 'Yes (Druid/Sorcerer/Warlock/Wizard)', cost: '12,000 gp', description: 'You have resistance to cold damage while you hold this staff. The staff has 10 charges. While holding it, you can use an action to expend 1 or more of its charges to cast one of the following spells from it, using your spell save DC: cone of cold (5 charges), fog cloud (1 charge), ice storm (4 charges), wall of ice (4 charges).' },
		{ name: 'Staff of Healing', source: 'DMG', page: 202, type: 'Staff', rarity: 'Rare', attunement: 'Yes (Bard/Cleric/Druid)', cost: '4,000 gp', description: 'This staff has 10 charges. While holding it, you can use an action to expend 1 or more of its charges to cast one of the following spells from it, using your spell save DC and spellcasting ability modifier: cure wounds (1 charge per spell level, up to 4th), lesser restoration (2 charges), mass cure wounds (5 charges).' },
		{ name: 'Staff of Power', source: 'DMG', page: 202, type: 'Staff', rarity: 'Very Rare', attunement: 'Yes (Sorcerer/Warlock/Wizard)', cost: '18,000 gp', description: 'This staff can be wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls. While holding it, you gain a +2 bonus to Armor Class, saving throws, and spell attack rolls. The staff has 20 charges for the following properties. The staff regains 2d8 + 4 expended charges daily at dawn.' },
		{ name: 'Staff of Striking', source: 'DMG', page: 203, type: 'Staff', rarity: 'Very Rare', attunement: 'Yes', cost: '15,000 gp', description: 'This staff can be wielded as a magic quarterstaff that grants a +3 bonus to attack and damage rolls. The staff has 10 charges. When you hit with a melee attack using it, you can expend up to 3 of its charges. For each charge you expend, the target takes an extra 1d6 force damage.' },
		{ name: 'Staff of Swarming Insects', source: 'DMG', page: 203, type: 'Staff', rarity: 'Rare', attunement: 'Yes (Bard/Cleric/Druid/Shaman/Warlock/Wizard)', cost: '4,000 gp', description: 'This staff has 10 charges and regains 1d6 + 4 expended charges daily at dawn. While holding the staff, you can use an action to expend some of its charges to cast one of the following spells from it, using your spell save DC: giant insect (4 charges) or insect plague (5 charges).' },
		{ name: 'Staff of the Magi', source: 'DMG', page: 203, type: 'Staff', rarity: 'Legendary', attunement: 'Yes (Sorcerer/Warlock/Wizard)', cost: '95,000 gp', description: 'This staff can be wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls. While you hold it, you gain a +2 bonus to spell attack rolls. The staff has 50 charges for the following properties. It regains 4d6 + 2 expended charges daily at dawn.' },
		{ name: 'Staff of the Python', source: 'DMG', page: 204, type: 'Staff', rarity: 'Uncommon', attunement: 'Yes (Cleric/Druid/Warlock)', cost: '400 gp', description: 'You can use an action to speak this staff\'s command word and throw the staff on the ground within 10 feet of you. The staff becomes a giant constrictor snake under your control and acts on its own initiative count. By using a bonus action to speak the command word again, you return the staff to its normal form.' },
		{ name: 'Staff of the Woodlands', source: 'DMG', page: 204, type: 'Staff', rarity: 'Rare', attunement: 'Yes (Druid)', cost: '4,500 gp', description: 'This staff can be wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls. While holding it, you have a +2 bonus to spell attack rolls. The staff has 10 charges for the following properties. It regains 1d6 + 4 expended charges daily at dawn.' },
		{ name: 'Staff of Thunder and Lightning', source: 'DMG', page: 204, type: 'Staff', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'This staff can be wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls. It also has the following additional properties. When one of these properties is used, it can\'t be used again until the next dawn: Lightning, Thunder, Lightning Strike, Thunderclap, Thunder and Lightning.' },
		{ name: 'Staff of Withering', source: 'DMG', page: 205, type: 'Staff', rarity: 'Rare', attunement: 'Yes (Cleric/Druid/Warlock)', cost: '4,000 gp', description: 'This staff has 3 charges and regains 1d3 expended charges daily at dawn. The staff can be wielded as a magic quarterstaff. On a hit, it deals damage as a normal quarterstaff, and you can expend 1 charge to deal an extra 2d10 necrotic damage to the target. In addition, the target must succeed on a DC 15 Constitution saving throw or have disadvantage for 1 hour on any ability check or saving throw that uses Strength or Constitution.' },
		// WANDS
		{ name: 'Wand of Binding', source: 'DMG', page: 209, type: 'Wand', rarity: 'Rare', attunement: 'Yes (Spellcaster)', cost: '3,000 gp', description: 'This wand has 7 charges for the following properties. It regains 1d6 + 1 expended charges daily at dawn. If you expend the wand\'s last charge, roll a d20. On a 1, the wand crumbles into ashes and is destroyed. While holding the wand, you can use an action to expend some of its charges to cast hold monster (5 charges) or hold person (2 charges), using your spell save DC.' },
		{ name: 'Wand of Enemy Detection', source: 'DMG', page: 210, type: 'Wand', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'This wand has 7 charges. While holding it, you can use an action and expend 1 charge to speak its command word. For the next minute, you know the direction of the nearest creature hostile to you within 60 feet of you, but not its distance from you. The wand can sense the presence of hostile creatures that are ethereal, invisible, disguised, or hidden, as well as those in plain sight. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Fear', source: 'DMG', page: 210, type: 'Wand', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'This wand has 7 charges for the following properties. It regains 1d6 + 1 expended charges daily at dawn. While holding the wand, you can use an action to expend 1 of its charges to cause the tip of the wand to emit a 60-foot cone of amber light. Each creature in the cone must succeed on a DC 15 Wisdom saving throw or become frightened of you for 1 minute.' },
		{ name: 'Wand of Fireballs', source: 'DMG', page: 210, type: 'Wand', rarity: 'Rare', attunement: 'Yes (Spellcaster)', cost: '3,000 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the fireball spell (save DC 15) from it. For 1 charge, you cast the 3rd-level version of the spell. You can increase the spell slot level by one for each additional charge you expend. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Lightning Bolts', source: 'DMG', page: 211, type: 'Wand', rarity: 'Rare', attunement: 'Yes (Spellcaster)', cost: '3,000 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the lightning bolt spell (save DC 15) from it. For 1 charge, you cast the 3rd-level version of the spell. You can increase the spell slot level by one for each additional charge you expend. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Magic Detection', source: 'DMG', page: 211, type: 'Wand', rarity: 'Uncommon', attunement: 'No', cost: '200 gp', description: 'This wand has 3 charges. While holding it, you can expend 1 charge as an action to cast the detect magic spell from it. The wand regains 1d3 expended charges daily at dawn.' },
		{ name: 'Wand of Magic Missiles', source: 'DMG', page: 211, type: 'Wand', rarity: 'Uncommon', attunement: 'No', cost: '350 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the magic missile spell from it. For 1 charge, you cast the 1st-level version of the spell. You can increase the spell slot level by one for each additional charge you expend. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Paralysis', source: 'DMG', page: 211, type: 'Wand', rarity: 'Rare', attunement: 'Yes (Spellcaster)', cost: '3,000 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 of its charges to cause a thin blue ray to streak from the tip toward a creature you can see within 60 feet of you. The target must succeed on a DC 15 Constitution saving throw or be paralyzed for 1 minute. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Polymorph', source: 'DMG', page: 211, type: 'Wand', rarity: 'Very Rare', attunement: 'Yes (Spellcaster)', cost: '8,000 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 of its charges to cast the polymorph spell (save DC 15) from it. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Secrets', source: 'DMG', page: 211, type: 'Wand', rarity: 'Uncommon', attunement: 'No', cost: '250 gp', description: 'The wand has 3 charges. While holding it, you can use an action to expend 1 of its charges, and if a secret door or trap is within 30 feet of you, the wand pulses and points at the one nearest to you. The wand regains 1d3 expended charges daily at dawn.' },
		{ name: 'Wand of the War Mage +1', source: 'DMG', page: 212, type: 'Wand', rarity: 'Uncommon', attunement: 'Yes (Spellcaster)', cost: '400 gp', description: 'While holding this wand, you gain a +1 bonus to spell attack rolls. In addition, you ignore half cover when making a spell attack.' },
		{ name: 'Wand of the War Mage +2', source: 'DMG', page: 212, type: 'Wand', rarity: 'Rare', attunement: 'Yes (Spellcaster)', cost: '2,000 gp', description: 'While holding this wand, you gain a +2 bonus to spell attack rolls. In addition, you ignore half cover when making a spell attack.' },
		{ name: 'Wand of the War Mage +3', source: 'DMG', page: 212, type: 'Wand', rarity: 'Very Rare', attunement: 'Yes (Spellcaster)', cost: '10,000 gp', description: 'While holding this wand, you gain a +3 bonus to spell attack rolls. In addition, you ignore half cover when making a spell attack.' },
		{ name: 'Wand of Web', source: 'DMG', page: 212, type: 'Wand', rarity: 'Uncommon', attunement: 'Yes (Spellcaster)', cost: '400 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 of its charges to cast the web spell (save DC 15) from it. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		{ name: 'Wand of Wonder', source: 'DMG', page: 212, type: 'Wand', rarity: 'Rare', attunement: 'Yes (Spellcaster)', cost: '3,500 gp', description: 'The wand has 7 charges. While holding it, you can use an action to expend 1 of its charges and choose a target within 120 feet of you. The target can be a creature, an object, or a point in space. Roll d100 and consult the table in the DMG to discover what happens. The wand regains 1d6 + 1 expended charges daily at dawn.' },
		// WEAPONS
		{ name: 'Arrow of Slaying', source: 'DMG', page: 152, type: 'Weapon', rarity: 'Very Rare', attunement: 'No', cost: '600 gp', description: 'An arrow of slaying is a magic weapon meant to kill a particular kind of creature. The DM chooses the type or determines it randomly. If a creature belonging to the type associated with an arrow of slaying takes damage from the arrow, the creature must make a DC 17 Constitution saving throw, taking an extra 6d10 piercing damage on a failed save, or half as much extra damage on a successful one.' },
		{ name: 'Berserker Axe', source: 'DMG', page: 155, type: 'Weapon', rarity: 'Rare', attunement: 'Yes (Cursed)', cost: '1,000 gp', description: 'You gain a +1 bonus to attack and damage rolls with this magic weapon. In addition, while you are attuned to this weapon, your hit point maximum increases by 1 for each level you have attained. Curse: This weapon is cursed, and becoming attuned to it extends the curse to you. As long as you remain cursed, you are unwilling to part with the axe.' },
		{ name: 'Dancing Sword', source: 'DMG', page: 161, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'You can use a bonus action to toss this magic sword into the air and speak the command word. When you do so, the sword begins to hover, flies up to 30 feet, and attacks one creature of your choice within 5 feet of it. The sword uses your attack roll and ability score modifier to damage rolls.' },
		{ name: 'Defender', source: 'DMG', page: 164, type: 'Weapon', rarity: 'Legendary', attunement: 'Yes', cost: '80,000 gp', description: 'You gain a +3 bonus to attack and damage rolls made with this magic weapon. The first time you attack with the sword on each of your turns, you can transfer some or all of the sword\'s bonus to your Armor Class, instead of using the bonus on any attacks that turn.' },
		{ name: 'Dwarven Thrower', source: 'DMG', page: 167, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes (Dwarf)', cost: '15,000 gp', description: 'You gain a +3 bonus to attack and damage rolls made with this magic weapon. It has the thrown property with a normal range of 20 feet and a long range of 60 feet. When you hit with a ranged attack using this weapon, it deals an extra 1d8 damage or, if the target is a giant, 2d8 damage. Immediately after the attack, the weapon flies back to your hand.' },
		{ name: 'Flame Tongue', source: 'DMG', page: 170, type: 'Weapon', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'You can use a bonus action to speak this magic sword\'s command word, causing flames to erupt from the blade. These flames shed bright light in a 40-foot radius and dim light for an additional 40 feet. While the sword is ablaze, it deals an extra 2d6 fire damage to any target it hits. The flames last until you use a bonus action to speak the command word again or until you drop or sheathe the sword.' },
		{ name: 'Frost Brand', source: 'DMG', page: 171, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'When you hit with an attack using this magic sword, the target takes an extra 1d6 cold damage. In addition, while you hold the sword, you have resistance to fire damage. In freezing temperatures, the blade sheds bright light in a 10-foot radius and dim light for an additional 10 feet.' },
		{ name: 'Giant Slayer', source: 'DMG', page: 172, type: 'Weapon', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'You gain a +1 bonus to attack and damage rolls made with this magic weapon. When you hit a giant with it, the giant takes an extra 2d6 damage of the weapon\'s type and must succeed on a DC 15 Strength saving throw or fall prone.' },
		{ name: 'Hammer of Thunderbolts', source: 'DMG', page: 173, type: 'Weapon', rarity: 'Legendary', attunement: 'No', cost: '60,000 gp', description: 'You gain a +1 bonus to attack and damage rolls made with this magic weapon. While wearing a belt of giant strength (any variety) and gauntlets of ogre power and wielding the hammer, you can set the weapon to deal an extra 5d6 thunder damage on a hit. If the target is a giant, it must succeed on a DC 17 Constitution saving throw or die.' },
		{ name: 'Holy Avenger', source: 'DMG', page: 174, type: 'Weapon', rarity: 'Legendary', attunement: 'Yes (Paladin)', cost: '80,000 gp', description: 'You gain a +3 bonus to attack and damage rolls made with this magic weapon. When you hit a fiend or an undead with it, that creature takes an extra 2d10 radiant damage. While you hold the drawn sword, it creates an aura in a 10-foot radius around you. You and all creatures friendly to you in the aura have advantage on saving throws against spells and other magical effects.' },
		{ name: 'Javelin of Lightning', source: 'DMG', page: 178, type: 'Weapon', rarity: 'Uncommon', attunement: 'No', cost: '500 gp', description: 'This javelin is a magic weapon. When you hurl it and speak its command word, it transforms into a bolt of lightning, forming a line 5 feet wide that extends out from you to a target within 120 feet of you. Each creature in the line excluding you and the target must make a DC 13 Dexterity saving throw, taking 4d6 lightning damage on a failed save, and half as much damage on a successful one. The lightning bolt turns back into a javelin when it reaches the target. Make a ranged weapon attack against the target. On a hit, the target takes damage from the javelin plus 4d6 lightning damage.' },
		{ name: 'Luck Blade', source: 'DMG', page: 179, type: 'Weapon', rarity: 'Legendary', attunement: 'Yes', cost: '90,000 gp', description: 'You gain a +1 bonus to attack and damage rolls made with this magic weapon. While the sword is on your person, you also gain a +1 bonus to saving throws. If the sword is on your person, you can call on its luck (no action required) to reroll one attack roll, ability check, or saving throw you dislike. You must use the second roll. This property can\'t be used again until the next dawn.' },
		{ name: 'Mace of Disruption', source: 'DMG', page: 179, type: 'Weapon', rarity: 'Rare', attunement: 'Yes', cost: '2,000 gp', description: 'When you hit a fiend or an undead with this magic weapon, that creature takes an extra 2d6 radiant damage. If the target has 25 hit points or fewer after taking this damage, it must succeed on a DC 15 Wisdom saving throw or be destroyed. On a successful save, the creature becomes frightened of you until the end of your next turn.' },
		{ name: 'Mace of Smiting', source: 'DMG', page: 179, type: 'Weapon', rarity: 'Rare', attunement: 'No', cost: '3,000 gp', description: 'You gain a +1 bonus to attack and damage rolls made with this magic weapon. The bonus increases to +3 when you use the mace to attack a construct. When you roll a 20 on an attack roll made with this weapon, the target takes an extra 2d6 bludgeoning damage, or 4d6 bludgeoning damage if it\'s a construct. If a construct has 25 hit points or fewer after taking this damage, it is destroyed.' },
		{ name: 'Mace of Terror', source: 'DMG', page: 180, type: 'Weapon', rarity: 'Rare', attunement: 'Yes', cost: '2,000 gp', description: 'This magic weapon has 3 charges. While holding it, you can use an action and expend 1 charge to release a wave of terror. Each creature of your choice in a 30-foot radius extending from you must succeed on a DC 15 Wisdom saving throw or become frightened of you for 1 minute. The weapon regains 1d3 expended charges daily at dawn.' },
		{ name: 'Nine Lives Stealer', source: 'DMG', page: 183, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes', cost: '10,000 gp', description: 'You gain a +2 bonus to attack and damage rolls made with this magic weapon. The sword has 1d8 + 1 charges. If you score a critical hit against a creature that has fewer than 100 hit points, it must succeed on a DC 15 Constitution saving throw or be slain instantly as the sword tears its life force from its body. The sword loses 1 charge if the creature is slain.' },
		{ name: 'Oathbow', source: 'DMG', page: 183, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes', cost: '10,000 gp', description: 'When you nock an arrow on this bow, it whispers in Elvish, "Swift defeat to my enemies." When you use this weapon to attack your sworn enemy, you have advantage on the attack roll. In addition, your target gains no benefit from cover, other than total cover, and you suffer no disadvantage due to long range.' },
		{ name: 'Scimitar of Speed', source: 'DMG', page: 199, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'You gain a +2 bonus to attack and damage rolls made with this magic weapon. In addition, you can make one attack with it as a bonus action on each of your turns.' },
		{ name: 'Sun Blade', source: 'DMG', page: 205, type: 'Weapon', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'This item appears to be a longsword hilt. While grasping the hilt, you can use a bonus action to cause a blade of pure radiance to spring into existence, or make the blade disappear. While the blade exists, this magic longsword has the finesse property. You gain a +2 bonus to attack and damage rolls made with this weapon, which deals radiant damage instead of slashing damage.' },
		{ name: 'Sword of Life Stealing', source: 'DMG', page: 206, type: 'Weapon', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'When you attack a creature with this magic weapon and roll a 20 on the attack roll, that target takes an extra 10 necrotic damage if it isn\'t a construct or an undead. You also gain 10 temporary hit points.' },
		{ name: 'Sword of Sharpness', source: 'DMG', page: 206, type: 'Weapon', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'When you attack an object with this magic sword and hit, maximize your weapon damage dice against the target. When you attack a creature with this weapon and roll a 20 on the attack roll, that target takes an extra 14 slashing damage. Then roll another d20. If you roll a 20, you lop off one of the target\'s limbs, with the effect of such loss determined by the DM.' },
		{ name: 'Sword of Wounding', source: 'DMG', page: 207, type: 'Weapon', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'Hit points lost to this weapon\'s damage can be regained only through a short or long rest, rather than by regeneration, magic, or any other means. Once per turn, when you hit a creature with an attack using this magic weapon, you can wound the target. At the start of each of the wounded creature\'s turns, it takes 1d4 necrotic damage for each time you\'ve wounded it.' },
		{ name: 'Trident of Fish Command', source: 'DMG', page: 209, type: 'Weapon', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'This magic weapon has 3 charges. While you carry it, you can use an action and expend 1 charge to cast dominate beast (save DC 15) from it on a beast that has an innate swimming speed. The trident regains 1d3 expended charges daily at dawn.' },
		{ name: 'Vicious Weapon', source: 'DMG', page: 209, type: 'Weapon', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'When you roll a 20 on your attack roll with this magic weapon, your critical hit deals an extra 7 damage of the weapon\'s type.' },
		{ name: 'Vorpal Sword', source: 'DMG', page: 209, type: 'Weapon', rarity: 'Legendary', attunement: 'Yes', cost: '80,000 gp', description: 'You gain a +3 bonus to attack and damage rolls made with this magic weapon. In addition, the weapon ignores resistance to slashing damage. When you attack a creature that has at least one head with this weapon and roll a 20 on the attack roll, you cut off one of the creature\'s heads. The creature dies if it can\'t survive without the lost head.' },
		{ name: 'Weapon +1', source: 'DMG', page: 213, type: 'Weapon', rarity: 'Uncommon', attunement: 'No', cost: '500 gp', description: 'You have a +1 bonus to attack and damage rolls made with this magic weapon.' },
		{ name: 'Weapon +2', source: 'DMG', page: 213, type: 'Weapon', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'You have a +2 bonus to attack and damage rolls made with this magic weapon.' },
		{ name: 'Weapon +3', source: 'DMG', page: 213, type: 'Weapon', rarity: 'Very Rare', attunement: 'No', cost: '10,000 gp', description: 'You have a +3 bonus to attack and damage rolls made with this magic weapon.' },
		{ name: 'Wind Fan', source: 'DMG', page: 213, type: 'Weapon', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'While holding this fan, you can use an action to cast the gust of wind spell (save DC 13) from it. Once used, the fan shouldn\'t be used again until the next dawn. Each time it is used again before then, it has a cumulative 20 percent chance of not working and tearing into useless, nonmagical tatters.' },
		// WONDROUS ITEMS
		{ name: 'Alchemy Jug', source: 'DMG', page: 150, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This ceramic jug appears to be able to hold a gallon of liquid and weighs 12 pounds whether full or empty. Sloshing sounds can be heard from within the jug when it is shaken, even if the jug is empty. You can use an action and name one liquid from the table below to cause the jug to produce the chosen liquid. Afterward, you can uncork the jug as an action and pour that liquid out.' },
		{ name: 'Amulet of Health', source: 'DMG', page: 150, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '2,400 gp', description: 'Your Constitution score is 19 while you wear this amulet. It has no effect on you if your Constitution is already 19 or higher.' },
		{ name: 'Amulet of Proof Against Detection and Location', source: 'DMG', page: 150, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing this amulet, you are hidden from divination magic. You can\'t be targeted by such magic or perceived through magical scrying sensors.' },
		{ name: 'Amulet of the Planes', source: 'DMG', page: 150, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '16,000 gp', description: 'While wearing this amulet, you can use an action to name a location that you are familiar with on another plane of existence. Then make a DC 15 Intelligence check. On a successful check, you cast the plane shift spell. On a failure, you and each creature and object within 15 feet of you travel to a random destination.' },
		{ name: 'Bag of Devouring', source: 'DMG', page: 153, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'No', cost: '— gp', description: 'This bag superficially resembles a bag of holding but is a feeding orifice for a gigantic extradimensional creature. Placing an object in the bag causes the bag to attempt to swallow it. A creature that places a limb into the bag is subjected to a mouth attack (+8 to hit) dealing 3d6 piercing damage.' },
		{ name: 'Bag of Holding', source: 'DMG', page: 153, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This bag has an interior space considerably larger than its outside dimensions, roughly 2 feet in diameter at the mouth and 4 feet deep. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet. The bag weighs 15 pounds, regardless of its contents. Retrieving an item from the bag requires an action. If the bag is overloaded, pierced, or torn, it ruptures and is destroyed.' },
		{ name: 'Bag of Tricks', source: 'DMG', page: 154, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'This ordinary bag, made from gray, rust, or tan cloth, appears empty. Reaching inside the bag, however, reveals the presence of a small, fuzzy object. You can use an action to pull the fuzzy object from the bag and throw it up to 20 feet. When the object lands, it transforms into a creature determined by rolling a d8.' },
		{ name: 'Bead of Force', source: 'DMG', page: 154, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'This small black sphere measures 3/4 of an inch in diameter and weighs an ounce. Typically, 1d4 + 4 beads of force are found together. You can use an action to throw the bead up to 60 feet. The bead explodes on impact and is destroyed. Each creature within a 10-foot radius of where the bead landed must succeed on a DC 15 Dexterity saving throw or take 5d4 force damage. A sphere of transparent force then encloses the area for 1 minute.' },
		{ name: 'Belt of Dwarvenkind', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'While wearing this belt, you gain the following benefits: your Constitution score increases by 2, to a maximum of 20; you have advantage on Charisma (Persuasion) checks made to interact with dwarves; you have advantage on saving throws against poison, and you have resistance to poison damage; you have darkvision out to a range of 60 feet.' },
		{ name: 'Belt of Giant Strength (Hill)', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'While wearing this belt, your Strength score changes to 21. The item has no effect on you if your Strength without the belt is equal to or greater than the belt\'s score.' },
		{ name: 'Belt of Giant Strength (Stone/Frost)', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '16,000 gp', description: 'While wearing this belt, your Strength score changes to 23 (Stone or Frost Giant strength).' },
		{ name: 'Belt of Giant Strength (Fire)', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '20,000 gp', description: 'While wearing this belt, your Strength score changes to 25 (Fire Giant strength).' },
		{ name: 'Belt of Giant Strength (Cloud)', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'Yes', cost: '80,000 gp', description: 'While wearing this belt, your Strength score changes to 27 (Cloud Giant strength).' },
		{ name: 'Belt of Giant Strength (Storm)', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'Yes', cost: '200,000 gp', description: 'While wearing this belt, your Strength score changes to 29 (Storm Giant strength).' },
		{ name: 'Boots of Elvenkind', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'While you wear these boots, your steps make no sound, regardless of the surface you are moving across. You also have advantage on Dexterity (Stealth) checks that rely on moving silently.' },
		{ name: 'Boots of Levitation', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'While you wear these boots, you can use an action to cast the levitate spell on yourself at will.' },
		{ name: 'Boots of Speed', source: 'DMG', page: 155, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'While you wear these boots, you can use a bonus action and click the boots\' heels together to double your walking speed. When you use this feature, difficult terrain doesn\'t cost you extra movement. You can end this effect as a bonus action. The effect ends after 10 minutes.' },
		{ name: 'Boots of Striding and Springing', source: 'DMG', page: 156, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'While you wear these boots, your walking speed becomes 30 feet, unless your walking speed is higher, and your speed isn\'t reduced if you are encumbered or wearing heavy armor. In addition, you can jump three times the normal distance, though you can\'t jump farther than your remaining movement would allow.' },
		{ name: 'Boots of the Winterlands', source: 'DMG', page: 156, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'These furred boots are snug and feel quite warm. While you wear them, you gain the following benefits: You have resistance to cold damage. You ignore difficult terrain created by ice or snow. You can tolerate temperatures as low as −50 degrees Fahrenheit without any additional protection.' },
		{ name: 'Bracers of Archery', source: 'DMG', page: 156, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing these bracers, you have proficiency with the longbow and shortbow, and you gain a +2 bonus to damage rolls on ranged attacks made with such weapons.' },
		{ name: 'Bracers of Defense', source: 'DMG', page: 156, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '6,000 gp', description: 'While wearing these bracers, you gain a +2 bonus to AC if you are wearing no armor and using no shield.' },
		{ name: 'Brooch of Shielding', source: 'DMG', page: 156, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing this brooch, you have resistance to force damage, and you have immunity to damage from the magic missile spell.' },
		{ name: 'Broom of Flying', source: 'DMG', page: 156, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This wooden broom, which weighs 3 pounds, functions like a mundane broom until you stand astride it and speak its command word. It then hovers beneath you and can be ridden in the air. It has a flying speed of 50 feet. It can carry up to 400 pounds, but its flying speed becomes 30 feet while carrying over 200 pounds.' },
		{ name: 'Cape of the Mountebank', source: 'DMG', page: 157, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '3,000 gp', description: 'This cape smells faintly of brimstone. While wearing it, you can use it to cast the dimension door spell as an action. This property of the cape can\'t be used again until the next dawn.' },
		{ name: 'Carpet of Flying', source: 'DMG', page: 157, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'No', cost: '20,000 gp', description: 'You can speak the carpet\'s command word as an action to make the carpet hover and fly. It moves according to your spoken directions, provided that you are within 30 feet of it. Four sizes of carpet of flying exist. The DM chooses the size of a given carpet or determines it randomly.' },
		{ name: 'Circlet of Blasting', source: 'DMG', page: 158, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'While wearing this circlet, you can use an action to cast the scorching ray spell with it. When you make the spell\'s attacks, you do so with an attack bonus of +5. The property can\'t be used again until the next dawn.' },
		{ name: 'Cloak of Arachnida', source: 'DMG', page: 158, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '5,000 gp', description: 'This fine garment is made of black silk interwoven with faint silvery threads. While wearing it, you gain the following benefits: you have resistance to poison damage, you have a climbing speed equal to your walking speed, you can move up, down, and across vertical surfaces and upside down along ceilings, and you can\'t be caught in webs.' },
		{ name: 'Cloak of Displacement', source: 'DMG', page: 158, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '5,000 gp', description: 'While you wear this cloak, it projects an illusion that makes you appear to be standing in a place near your actual location, causing any creature to have disadvantage on attack rolls against you. If you take damage, the property ceases to function until the start of your next turn. This property is suppressed while you are incapacitated, restrained, or otherwise unable to move.' },
		{ name: 'Cloak of Elvenkind', source: 'DMG', page: 158, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While you wear this cloak with its hood up, Wisdom (Perception) checks made to see you have disadvantage, and you have advantage on Dexterity (Stealth) checks made to hide, as the cloak\'s color shifts to camouflage you.' },
		{ name: 'Cloak of Protection', source: 'DMG', page: 159, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'You gain a +1 bonus to AC and saving throws while you wear this cloak.' },
		{ name: 'Cloak of the Bat', source: 'DMG', page: 159, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'While wearing this cloak, you have advantage on Dexterity (Stealth) checks. In an area of dim light or darkness, you can grip the edges of the cloak with both hands and use it to fly at a speed of 40 feet. If you ever fail to grip the cloak\'s edges while flying in this way, or if you are no longer in dim light or darkness, you lose this flying speed.' },
		{ name: 'Cloak of the Manta Ray', source: 'DMG', page: 159, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'While wearing this cloak with its hood up, you can breathe underwater, and you have a swimming speed of 60 feet. Pulling the hood up or down requires an action.' },
		{ name: 'Crystal Ball', source: 'DMG', page: 159, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '50,000 gp', description: 'This crystal ball is about 6 inches in diameter. While touching it, you can cast the scrying spell (save DC 17) with it. The spell lasts for its normal duration. A crystal ball of telepathy or true seeing has additional properties depending on the type.' },
		{ name: 'Cube of Force', source: 'DMG', page: 159, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '16,000 gp', description: 'This cube is about an inch across. Each face has a distinct marking on it that can be pressed. The cube starts with 36 charges, and it regains 1d20 expended charges daily at dawn. You can use an action to press one of the cube\'s faces, expending a number of charges based on the chosen face.' },
		{ name: 'Daern\'s Instant Fortress', source: 'DMG', page: 160, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '16,000 gp', description: 'You can use an action to place this 1-inch metal cube on the ground and speak its command word. The cube rapidly grows into a fortress that remains until you use an action to speak the command word that dismisses it, which works only if the fortress is empty.' },
		{ name: 'Decanter of Endless Water', source: 'DMG', page: 161, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This stoppered flask sloshes when shaken, as if it contains water. The decanter weighs 2 pounds. You can use an action to remove the stopper and speak one of three command words, whereupon an amount of fresh water or salt water (your choice) pours out of the flask.' },
		{ name: 'Deck of Illusions', source: 'DMG', page: 161, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This box contains a set of parchment cards. A full deck has 34 cards. A deck found as treasure is usually missing 1d20 − 1 cards. The magic of the deck functions only if cards are drawn at random. You can use an action to draw a card at random from the deck and throw it to the ground at a point within 30 feet of you. An illusion of one or more creatures forms over the thrown card.' },
		{ name: 'Deck of Many Things', source: 'DMG', page: 162, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'No', cost: '— gp', description: 'Usually found in a box or pouch, this deck contains a number of cards made of ivory or vellum. Before you draw a card, you must declare how many cards you intend to draw and then draw them randomly. Any number of cards in excess of this number have no effect. Otherwise, as soon as you draw a card from the deck, its magic takes effect.' },
		{ name: 'Dimensional Shackles', source: 'DMG', page: 165, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'You can use an action to place these shackles on an incapacitated creature. The shackles adjust to fit a creature of Small to Large size. In addition to serving as mundane manacles, the shackles prevent a creature bound by them from using any method of extradimensional movement, including teleportation or travel to a different plane of existence.' },
		{ name: 'Dust of Disappearance', source: 'DMG', page: 166, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'Found in a small packet, this powder resembles very fine sand. There is enough of it for one use. When you use an action to throw the dust into the air, you and each creature and object within 10 feet of you become invisible for 2d4 minutes. The duration is the same for all subjects, and the dust is consumed when its magic is activated.' },
		{ name: 'Dust of Dryness', source: 'DMG', page: 166, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '200 gp', description: 'This small packet contains 1d6 + 4 pinches of dust. You can use an action to sprinkle a pinch of it over water. The dust converts up to 15 feet of water in all directions into a marble-sized pellet, which floats or rests near where the dust was sprinkled. A creature can use an action to smash the pellet against a hard surface, causing the pellet to shatter and release the water the dust absorbed.' },
		{ name: 'Dust of Sneezing and Choking', source: 'DMG', page: 166, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '200 gp', description: 'Found in a small packet, this powder resembles very fine sand. It appears to be dust of disappearance, and an identify spell reveals it to be such. There is enough of it for one use. When you use an action to throw a handful of the dust into the air, you and each creature that needs to breathe within 30 feet of you must succeed on a DC 15 Constitution saving throw or become incapacitated for 1 minute due to uncontrollable sneezing.' },
		{ name: 'Efficient Quiver', source: 'DMG', page: 168, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'Each of the quiver\'s three compartments connects to an extradimensional space that allows the quiver to hold numerous items while never weighing more than 2 pounds. The shortest compartment can hold up to sixty arrows, bolts, or similar objects. The midsize compartment holds up to eighteen javelins or similar objects. The longest compartment holds up to six long objects, such as bows or spears.' },
		{ name: 'Efreeti Bottle', source: 'DMG', page: 167, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'No', cost: '16,000 gp', description: 'When you use an action to remove the stopper, a cloud of thick smoke flows out of the bottle. At the end of your turn, the smoke disappears with a loud crack, and an efreeti appears in an unoccupied space within 30 feet of you. There is a 10 percent chance that the efreeti is hostile. If it isn\'t hostile, it is under your control for 1 hour.' },
		{ name: 'Elemental Gem', source: 'DMG', page: 167, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'This gem contains a mote of elemental energy. When you use an action to break the gem, an elemental is summoned as if you had cast the conjure elemental spell, and the gem\'s magic is lost. The type of gem determines the elemental summoned.' },
		{ name: 'Eyes of Charming', source: 'DMG', page: 168, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'These crystal lenses fit over the eyes. They have 3 charges. While wearing them, you can expend 1 charge as an action to cast the charm person spell (save DC 13) on a humanoid within 30 feet of you, provided that you and the target can see each other. The lenses regain all expended charges daily at dawn.' },
		{ name: 'Eyes of Minute Seeing', source: 'DMG', page: 168, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '200 gp', description: 'These crystal lenses fit over the eyes. While wearing them, you can see much better than normal out to a range of 1 foot. You have advantage on Intelligence (Investigation) checks that rely on sight while searching an area or studying an object within that range.' },
		{ name: 'Eyes of the Eagle', source: 'DMG', page: 168, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'These crystal lenses fit over the eyes. While wearing them, you have advantage on Wisdom (Perception) checks that rely on sight. In conditions of clear visibility, you can make out details of even extremely distant creatures and objects as small as 2 feet across.' },
		{ name: 'Gauntlets of Ogre Power', source: 'DMG', page: 171, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'Your Strength score is 19 while you wear these gauntlets. They have no effect on you if your Strength is already 19 or higher.' },
		{ name: 'Gem of Brightness', source: 'DMG', page: 171, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This prism has 50 charges. While you are holding it, you can use an action to speak one of three command words to cause one of the following effects: shed bright light in a 30-foot radius with dim light for 30 feet beyond that, send a blinding beam at a creature, or create a flash of light in a 30-foot cone.' },
		{ name: 'Gem of Seeing', source: 'DMG', page: 172, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '16,000 gp', description: 'This gem has 3 charges. As an action, you can speak the gem\'s command word and expend 1 charge. For the next 10 minutes, you have truesight out to 120 feet when you peer through the gem. The gem regains 1d3 expended charges daily at dawn.' },
		{ name: 'Gloves of Missile Snaring', source: 'DMG', page: 172, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'These gloves seem to almost meld into your hands when you don them. When a ranged weapon attack hits you while you\'re wearing them, you can use your reaction to reduce the damage by 1d10 + your Dexterity modifier, provided that you have a free hand. If you reduce the damage to 0, you can catch the missile if it is small enough for you to hold in that hand.' },
		{ name: 'Gloves of Swimming and Climbing', source: 'DMG', page: 172, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing these gloves, climbing and swimming don\'t cost you extra movement, and you gain a +5 bonus to Strength (Athletics) checks made to climb or swim.' },
		{ name: 'Gloves of Thievery', source: 'DMG', page: 172, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'These gloves are invisible while worn. While wearing them, you gain a +5 bonus to Dexterity (Sleight of Hand) checks and Dexterity checks made to pick locks.' },
		{ name: 'Goggles of Night', source: 'DMG', page: 172, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '200 gp', description: 'While wearing these dark lenses, you have darkvision out to a range of 60 feet. If you already have darkvision, wearing the goggles increases its range by 60 feet.' },
		{ name: 'Headband of Intellect', source: 'DMG', page: 173, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'Your Intelligence score is 19 while you wear this headband. It has no effect on you if your Intelligence is already 19 or higher.' },
		{ name: 'Helm of Brilliance', source: 'DMG', page: 173, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '16,000 gp', description: 'This dazzling helm is set with 1d10 diamonds, 2d10 rubies, 3d10 fire opals, and 4d10 opals. Any gem pried from the helm crumbles to dust. When all the gems are removed or destroyed, the helm loses its magic. You gain the following benefits while wearing it: You can use an action and speak a command word to cause one gemstone to shed bright light out to 30 feet and dim light for 30 additional feet.' },
		{ name: 'Helm of Comprehending Languages', source: 'DMG', page: 173, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '500 gp', description: 'While wearing this helm, you can use an action to cast the comprehend languages spell from it at will.' },
		{ name: 'Helm of Telepathy', source: 'DMG', page: 174, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing this helm, you can use an action to cast the detect thoughts spell (save DC 13) from it. As long as you maintain concentration on the spell, you can use a bonus action to send a telepathic message to a creature you are focused on. It can reply—using a bonus action to do so—while your focus on it continues.' },
		{ name: 'Helm of Teleportation', source: 'DMG', page: 174, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '4,000 gp', description: 'This helm has 3 charges. While wearing it, you can use an action and expend 1 charge to cast the teleport spell from it. The helm regains 1d3 expended charges daily at dawn.' },
		{ name: 'Heward\'s Handy Haversack', source: 'DMG', page: 174, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'This backpack has a central pouch and two side pouches, each of which is an extradimensional space. Each side pouch can hold up to 20 pounds of material, not exceeding a volume of 2 cubic feet. The large central pouch can hold up to 8 cubic feet or 80 pounds of material. The backpack always weighs 5 pounds, regardless of its contents.' },
		{ name: 'Horn of Blasting', source: 'DMG', page: 174, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '4,500 gp', description: 'You can use an action to speak the horn\'s command word and then blow the horn, which emits a thunderous blast in a 30-foot cone that is audible 600 feet away. Each creature in the cone must make a DC 15 Constitution saving throw. On a failed save, a creature takes 5d6 thunder damage and is deafened for 1 minute.' },
		{ name: 'Horseshoes of a Zephyr', source: 'DMG', page: 175, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'No', cost: '8,000 gp', description: 'These iron horseshoes come in a set of four. While all four shoes are affixed to the hooves of a horse or similar creature, they allow the creature to move normally while floating 4 inches above the ground. This effect means the creature can cross or stand above nonsolid or unstable surfaces, such as water or lava.' },
		{ name: 'Horseshoes of Speed', source: 'DMG', page: 175, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '4,000 gp', description: 'These iron horseshoes come in a set of four. While all four shoes are affixed to the hooves of a horse or similar creature, they increase the creature\'s walking speed by 30 feet.' },
		{ name: 'Iron Bands of Bilarro', source: 'DMG', page: 177, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '4,000 gp', description: 'This rusty iron sphere measures 3 inches in diameter and weighs 1 pound. You can use an action to speak the command word and throw the sphere at a Huge or smaller creature you can see within 60 feet of you. As the sphere moves through the air, it opens into a tangle of metal bands.' },
		{ name: 'Iron Flask', source: 'DMG', page: 178, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'No', cost: '100,000 gp', description: 'This iron bottle has a brass stopper. You can use an action to speak the flask\'s command word, targeting a creature that you can see within 60 feet of you. If the target is native to a plane of existence other than the one you\'re on, the target must succeed on a DC 17 Wisdom saving throw or be trapped in the flask.' },
		{ name: 'Lantern of Revealing', source: 'DMG', page: 179, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'While lit, this hooded lantern burns for 6 hours on 1 pint of oil, shedding bright light in a 30-foot radius and dim light for an additional 30 feet. Invisible creatures and objects are visible as long as they are in the lantern\'s bright light.' },
		{ name: 'Medallion of Thoughts', source: 'DMG', page: 181, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'The medallion has 3 charges. While wearing it, you can use an action and expend 1 charge to cast the detect thoughts spell (save DC 13) from it. The medallion regains 1d3 expended charges daily at dawn.' },
		{ name: 'Mirror of Life Trapping', source: 'DMG', page: 181, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'No', cost: '18,000 gp', description: 'When this 4-foot-tall mirror is activated, any creature other than you that sees its reflection must succeed on a DC 15 Charisma saving throw or be trapped, along with anything it is wearing or carrying, in one of the mirror\'s twelve extradimensional cells.' },
		{ name: 'Necklace of Adaptation', source: 'DMG', page: 182, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While wearing this necklace, you can breathe normally in any environment, and you have advantage on saving throws made against harmful gases and vapors (such as cloudkill and stinking cloud effects, inhaled poisons, and the breath weapon of some dragons).' },
		{ name: 'Necklace of Fireballs', source: 'DMG', page: 182, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '2,000 gp', description: 'This necklace has 1d6 + 3 beads hanging from it. You can use an action to detach a bead and throw it up to 60 feet away. When it reaches the end of its trajectory, the bead detonates as a 3rd-level fireball spell (save DC 15).' },
		{ name: 'Necklace of Prayer Beads', source: 'DMG', page: 182, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Cleric/Druid/Paladin)', cost: '4,000 gp', description: 'This necklace has 1d4 + 2 magic beads made from aquamarine, black pearl, or topaz. It also has many nonmagical beads made from stones such as amber, bloodstone, citrine, coral, jade, pearl, or quartz. If a magic bead is removed from the necklace, that bead loses its magic. The magic beads can each be used to cast a spell.' },
		{ name: 'Pearl of Power', source: 'DMG', page: 184, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Spellcaster)', cost: '400 gp', description: 'While this pearl is on your person, you can use an action to speak its command word and regain one expended spell slot of up to 3rd level. Once you have used the pearl, it can\'t be used again until the next dawn.' },
		{ name: 'Periapt of Health', source: 'DMG', page: 184, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'You are immune to contracting any disease while you wear this pendant. If you are already infected with a disease, the effects of the disease are suppressed you while you wear the pendant.' },
		{ name: 'Periapt of Proof Against Poison', source: 'DMG', page: 184, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '5,000 gp', description: 'This delicate silver chain has a brilliant-cut black gem pendant. While you wear it, poisons have no effect on you. You are immune to the poisoned condition and have immunity to poison damage.' },
		{ name: 'Periapt of Wound Closure', source: 'DMG', page: 184, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While you wear this pendant, you stabilize whenever you are dying at the start of your turn. In addition, whenever you roll a Hit Die to regain hit points, double the number of hit points it restores.' },
		{ name: 'Pipes of Haunting', source: 'DMG', page: 185, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'You must be proficient with wind instruments to use these pipes. They have 3 charges. You can use an action to play them and expend 1 charge to create an eerie, spellbinding tune. Each creature within 30 feet of you that hears you play must succeed on a DC 15 Wisdom saving throw or become frightened of you for 1 minute. The pipes regain 1d3 expended charges daily at dawn.' },
		{ name: 'Pipes of the Sewers', source: 'DMG', page: 185, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '300 gp', description: 'You must be proficient with wind instruments to use these pipes. While you play them, you can use a bonus action to attract rats, giant rats, or wererats within 1 mile of you and compel them to go to you.' },
		{ name: 'Portable Hole', source: 'DMG', page: 185, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '8,000 gp', description: 'This fine black cloth, soft as silk, is folded up to the dimensions of a handkerchief. It unfolds into a circular sheet 6 feet in diameter. You can use an action to unfold a portable hole and place it on or against a solid surface, whereupon the portable hole creates an extradimensional hole 10 feet deep.' },
		{ name: 'Restorative Ointment', source: 'DMG', page: 197, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '300 gp', description: 'This glass jar, 3 inches in diameter, contains 1d4 + 1 doses of a thick mixture that smells faintly of aloe. The jar and its contents weigh 1/2 pound. As an action, one dose of the ointment can be swallowed or applied to the skin. The creature that receives it regains 2d8 + 2 hit points, ceases to be poisoned, and is cured of any disease.' },
		{ name: 'Robe of Eyes', source: 'DMG', page: 193, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '30,000 gp', description: 'This robe is adorned with eyelike patterns. While you wear the robe, you gain the following benefits: The robe lets you see in all directions, and you have advantage on Wisdom (Perception) checks that rely on sight. You have darkvision out to a range of 120 feet. You can see invisible creatures and objects, as well as see into the Ethereal Plane, out to a range of 120 feet.' },
		{ name: 'Robe of Scintillating Colors', source: 'DMG', page: 194, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '12,000 gp', description: 'This robe has 3 charges, and it regains 1d3 expended charges daily at dawn. While you wear it, you can use an action and expend 1 charge to cause the garment to display a shifting pattern of dazzling hues until the end of your next turn. During this time, the robe sheds bright light in a 30-foot radius and dim light for an additional 30 feet.' },
		{ name: 'Robe of Stars', source: 'DMG', page: 194, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '60,000 gp', description: 'This black or dark blue robe is embroidered with small white or silver stars. You gain a +1 bonus to saving throws while you wear it. Six stars, located on the robe\'s upper front portion, are particularly large. While wearing this robe, you can use an action to pull off one of the stars and use it to cast magic missile as a 5th-level spell.' },
		{ name: 'Robe of Useful Items', source: 'DMG', page: 195, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This robe has cloth patches of various shapes and colors covering it. While wearing the robe, you can use an action to detach one of the patches, causing it to become the object or creature it represents. The robe has two of each of the following patches.' },
		{ name: 'Rope of Climbing', source: 'DMG', page: 197, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'This 60-foot length of silk rope weighs 3 pounds and can hold up to 3,000 pounds. If you hold one end of the rope and use an action to speak the command word, the rope animates. As a bonus action, you can command the other end to move toward a destination you choose. The rope can move up to 10 feet on each of your turns.' },
		{ name: 'Rope of Entanglement', source: 'DMG', page: 197, type: 'Wondrous Item', rarity: 'Rare', attunement: 'No', cost: '4,000 gp', description: 'This rope is 30 feet long and weighs 3 pounds. If you hold one end of the rope and use an action to speak its command word, the other end darts forward to entangle a creature you can see within 20 feet of you. The target must succeed on a DC 15 Dexterity saving throw or become restrained.' },
		{ name: 'Scarab of Protection', source: 'DMG', page: 199, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'Yes', cost: '80,000 gp', description: 'If you hold this beetle-shaped medallion in your hand for 1 round, an inscription appears on its surface revealing its magical nature. It provides two benefits while it is on your person: You have advantage on saving throws against spells. The scarab has 12 charges. If you fail a saving throw against a necromancy spell or a harmful effect originating from an undead creature, you can use your reaction to expend 1 charge and turn the failed save into a successful one.' },
		{ name: 'Sending Stones', source: 'DMG', page: 199, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '200 gp', description: 'Sending stones come in pairs, with each smooth stone carved to match its counterpart so the pairing is easily recognized. While you touch one stone, you can use an action to cast the sending spell from it. The target is the bearer of the other stone. If no creature bears the stone, you know that fact as soon as you use the stone and don\'t cast the spell.' },
		{ name: 'Sentinel Shield', source: 'DMG', page: 199, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'No', cost: '400 gp', description: 'While holding this shield, you have advantage on initiative rolls and Wisdom (Perception) checks. The shield is emblazoned with a symbol of an eye.' },
		{ name: 'Slippers of Spider Climbing', source: 'DMG', page: 200, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While you wear these light shoes, you can move up, down, and across vertical surfaces and upside down along ceilings, while leaving your hands free. You have a climbing speed equal to your walking speed. However, the slippers don\'t allow you to move this way on a slippery surface, such as one covered by ice or oil.' },
		{ name: 'Stone of Good Luck', source: 'DMG', page: 205, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While this polished agate is on your person, you gain a +1 bonus to ability checks and saving throws.' },
		{ name: 'Well of Many Worlds', source: 'DMG', page: 213, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'No', cost: '80,000 gp', description: 'This fine black cloth, soft as silk, is folded up to the dimensions of a pocket handkerchief. It unfolds into a circular sheet 6 feet in diameter. You can use an action to unfold a well of many worlds and place it on or against a solid surface, whereupon it creates a two-way portal to a random location on a random plane of existence. Once opened, it can\'t be closed.' },
		{ name: 'Winged Boots', source: 'DMG', page: 214, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '500 gp', description: 'While you wear these boots, you have a flying speed equal to your walking speed. You can use the boots to fly for up to 4 hours, all at once or in several shorter flights, each one using a minimum of 1 minute from the duration. If you are flying when the duration expires, you descend at a rate of 30 feet per round until you land.' },
		{ name: 'Wings of Flying', source: 'DMG', page: 214, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '3,000 gp', description: 'While wearing this cloak, you can use an action to speak its command word. This turns the cloak into a pair of bat wings or bird wings on your back for 1 hour or until you repeat the command word as an action. The wings give you a flying speed of 60 feet. When they disappear, you can\'t use them again for 1d12 hours.' },
		// ── Xanathar's Guide to Everything (XGtE) ────────────────────────────────
		// ARMOR
		{ name: 'Armor of Gleaming', source: 'XGtE', page: 137, type: 'Armor', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This armor never gets dirty. Dust and grime slide off it, stains don\'t set, and it is always clean and bright.' },
		{ name: 'Cast-Off Armor', source: 'XGtE', page: 138, type: 'Armor', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'You can doff this armor as an action, rather than the normal time required.' },
		{ name: 'Shield of Expression', source: 'XGtE', page: 140, type: 'Armor', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'The front of this shield is shaped in the likeness of a face. While bearing the shield, you can use a bonus action to alter the face\'s expression to show any emotion you choose (happiness, sadness, anger, etc.).' },
		{ name: 'Smoldering Armor', source: 'XGtE', page: 140, type: 'Armor', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'Wisps of harmless, odorless smoke rise from this armor while it is worn. The smoke is not enough to obscure vision or create other effects.' },
		// STAFFS
		{ name: 'Staff of Adornment', source: 'XGtE', page: 140, type: 'Staff', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'If you place an object weighing no more than 1 pound (such as a shard of crystal, an egg, or a stone) above the tip of the staff while holding it, the object floats an inch from the staff\'s tip and remains there until it is removed or until the staff is no longer in your possession. Up to three such objects can float over the staff\'s tip at any given time.' },
		{ name: 'Staff of Birdcalls', source: 'XGtE', page: 140, type: 'Staff', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This wooden staff is decorated with bird carvings. It has 10 charges. While holding it, you can use an action to expend 1 charge from the staff and cause it to create one of the following sounds: a finch\'s chirp, a raven\'s caw, a duck\'s quack, a chicken\'s cluck, a parrot\'s squawk, a canary\'s song, or a cuckoo\'s call. The staff regains 1d6+4 expended charges daily at dawn.' },
		{ name: 'Staff of Flowers', source: 'XGtE', page: 140, type: 'Staff', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This wooden staff has 10 charges. While holding it, you can use an action to expend 1 charge from the staff and cause a flower to sprout from a patch of earth or soil within 5 feet of you. The flower is harmless and nonmagical. The staff regains 1d6+4 expended charges daily at dawn.' },
		// WANDS
		{ name: 'Wand of Conducting', source: 'XGtE', page: 141, type: 'Wand', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This wand has 3 charges. While holding it, you can use an action to expend 1 of its charges and create orchestral music by waving it around. The music can be heard out to a range of 60 feet and lasts for 1 minute. The wand regains all expended charges daily at dawn.' },
		{ name: 'Wand of Pyrotechnics', source: 'XGtE', page: 141, type: 'Wand', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This wand has 7 charges. While holding it, you can use an action to expend 1 of its charges and produce a harmless burst of multicolored light from the tip of the wand. The burst is accompanied by a crackling noise that can be heard out to 300 feet. The wand regains 1d6+1 expended charges daily at dawn.' },
		{ name: 'Wand of Scowls', source: 'XGtE', page: 141, type: 'Wand', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This wand has 3 charges. While holding it, you can use an action to expend 1 of its charges and target a humanoid within 30 feet of you. The target must succeed on a DC 10 Charisma saving throw or be forced to scowl for 1 minute. When its last charge is expended (rolled on d20), it transforms into a Wand of Smiles.' },
		{ name: 'Wand of Smiles', source: 'XGtE', page: 141, type: 'Wand', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This wand has 3 charges. While holding it, you can use an action to expend 1 of its charges and target a humanoid within 30 feet of you. The target must succeed on a DC 10 Charisma saving throw or be forced to smile for 1 minute. When its last charge is expended (rolled on d20), it transforms into a Wand of Scowls.' },
		// WEAPONS
		{ name: 'Moon-Touched Sword', source: 'XGtE', page: 138, type: 'Weapon', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'In darkness, the unsheathed blade of this sword sheds moonlight, creating bright light in a 15-foot radius and dim light for an additional 15 feet.' },
		{ name: 'Unbreakable Arrow', source: 'XGtE', page: 140, type: 'Weapon', rarity: 'Common', attunement: 'No', cost: '25 gp', description: 'This arrow can\'t be broken, except when it is within an antimagic field.' },
		{ name: 'Walloping Ammunition', source: 'XGtE', page: 140, type: 'Weapon', rarity: 'Common', attunement: 'No', cost: '25 gp', description: 'This ammunition packs a wallop. A creature hit by the ammunition must succeed on a DC 10 Strength saving throw or be knocked prone.' },
		// WONDROUS ITEMS (Common)
		{ name: 'Bead of Nourishment', source: 'XGtE', page: 137, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '50 gp', description: 'This spongy, flavorless, gelatinous bead dissolves on your tongue and provides as much nourishment as 1 day of rations.' },
		{ name: 'Bead of Refreshment', source: 'XGtE', page: 137, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '50 gp', description: 'This spongy bead dissolves in liquid, transforming up to a pint of the liquid into fresh, cold drinking water. The bead has no effect on magical liquids or on liquids that are harmful in nature.' },
		{ name: 'Boots of False Tracks', source: 'XGtE', page: 137, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'Only humanoids can wear these boots. While wearing the boots, you can choose to have them leave tracks like those of another kind of humanoid of your size.' },
		{ name: 'Candle of the Deep', source: 'XGtE', page: 137, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '50 gp', description: 'The flame of this candle is not extinguished when immersed in water. It gives off light and heat like a normal candle.' },
		{ name: 'Charlatan\'s Die', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'Whenever you roll this six-sided die, you can control which number it lands on. This is a six-sided die.' },
		{ name: 'Cloak of Billowing', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While wearing this cloak, you can use a bonus action to make it billow dramatically.' },
		{ name: 'Cloak of Many Fashions', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While wearing this cloak, you can use a bonus action to change the style, color, and apparent quality of the garment. The cloak\'s weight doesn\'t change. Regardless of its appearance, the cloak can\'t be anything but a cloak. Although it can duplicate the appearance of other magic cloaks, it doesn\'t duplicate their properties.' },
		{ name: 'Clockwork Amulet', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This copper amulet contains tiny interlocking gears and is powered by magic from Mechanus, a plane of clockwork predictability. A creature that puts an ear to the amulet can hear faint ticking and whirring noises. When you make an attack roll while wearing the amulet, you can forgo rolling the d20 to get a 10 on the die. Once used, this property can\'t be used again until the next dawn.' },
		{ name: 'Clothes of Mending', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This elegant outfit of traveler\'s clothes magically mends itself to counteract daily wear and tear. Pieces of the outfit that are separated from each other for more than a day lose the magic, and so are permanent holes, tears, and stains.' },
		{ name: 'Dark Shard Amulet', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes (Warlock)', cost: '75 gp', description: 'This amulet is fashioned from a single shard of resilient extraplanar material originating from the realm of your warlock patron. While you are wearing it, you gain the following benefits: You can use the amulet as a spellcasting focus for your warlock spells. You can try to cast a cantrip that you don\'t know, once per long rest; if you fail the DC 10 Arcana check, you take 1d6 psychic damage.' },
		{ name: 'Dread Helm', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This fearsome steel helm makes your eyes glow red while you wear it.' },
		{ name: 'Ear Horn of Hearing', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While using this horn, you can\'t be deafened and you have advantage on Wisdom (Perception) checks that rely on hearing, as though you had the keen hearing trait.' },
		{ name: 'Enduring Spellbook', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This spellbook, along with anything written in it, can\'t be damaged by fire or immersion in water. In addition, the spellbook doesn\'t deteriorate with age.' },
		{ name: 'Ersatz Eye', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'This artificial eye replaces a real one that was lost or removed. While the ersatz eye is embedded in your eye socket, it can\'t be removed by anyone other than you, and you can see through the tiny orb as though it were a normal eye.' },
		{ name: 'Hat of Vermin', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This hat has 3 charges. While holding the hat, you can use an action to expend 1 of its charges and speak a command word that summons your choice of a bat, a frog, or a rat. The summoned creature magically appears in the hat and tries to get away from you as quickly as possible. The creature is neither friendly nor hostile, and it isn\'t under your control. It behaves as an ordinary creature of its kind and disappears after 1 hour or when it drops to 0 hit points. The hat regains all expended charges daily at dawn.' },
		{ name: 'Hat of Wizardry', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes (Wizard)', cost: '75 gp', description: 'This hat has a conical shape and is adorned with glyphs of various spells. While you are wearing it, you gain the following benefits: You can use the hat as a spellcasting focus for your wizard spells. You can try to cast a cantrip that you don\'t know, once per long rest; if you fail the DC 10 Arcana check, you take 1d6 psychic damage.' },
		{ name: 'Heward\'s Handy Spice Pouch', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This belt pouch appears empty and has 10 charges. While holding the pouch, you can use an action to expend 1 of its charges, speak the name of any nonmagical foodstuff, and remove a pinch of powdered spice from the pouch. The spice appears in your hand. It can be used as seasoning or other culinary purposes. The pouch regains 1d6+4 expended charges daily at dawn.' },
		{ name: 'Horn of Silent Alarm', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This horn has 4 charges. When you use an action to blow it, one creature of your choice can hear the horn\'s blare, provided the creature is within 600 feet of the horn and not deafened. No other creature hears sound coming from the horn. The horn regains 1d4 expended charges daily at dawn.' },
		{ name: 'Instrument of Illusions', source: 'XGtE', page: 138, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'While you are playing this musical instrument, you can create harmless, illusory visual effects within a 5-foot-radius sphere centered on the instrument. If you are a bard, the radius increases to 15 feet. Sample visual effects include luminous musical notes, a spectral dancer, butterflies, and gently falling snow. The magical effects have neither substance nor sound, and they disappear immediately when you stop playing.' },
		{ name: 'Instrument of Scribing', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'This musical instrument has 3 charges. While you are playing it, you can use an action to expend 1 charge from the instrument and write a magical message on a nonmagical object or surface that you can see within 30 feet of you. The message can be up to six words long and is written in a language you know. If you are a bard, you can scribe seven words and choose to make the message glow. The message fades away after 24 hours or when you use an action to touch the message and speak a command word. The instrument regains all expended charges daily at dawn.' },
		{ name: 'Lock of Trickery', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This lock appears to be an ordinary lock (of the type described in chapter 5 of the Player\'s Handbook) and comes with a single key. The tumblers in this lock magically adjust to thwart burglars. Dexterity checks made to pick the lock have disadvantage.' },
		{ name: 'Mystery Key', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'A question mark is worked into the head of this key. The key has a 5 percent chance of unlocking any lock into which it\'s inserted. Once it unlocks something, the key disappears.' },
		{ name: 'Orb of Direction', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While holding this orb, you can use an action to determine which way is north. This property functions only on the Material Plane.' },
		{ name: 'Orb of Time', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While holding this orb, you can use an action to determine what time of day it is. This property functions only on the Material Plane.' },
		{ name: 'Perfume of Bewitching', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This tiny vial contains magic perfume, enough for one use. You can use an action to apply the perfume to yourself, and its effect lasts 1 hour. For the duration, you have advantage on all Charisma checks directed at humanoids of challenge rating 1 or lower. Those subjected to the perfume\'s effect are not aware that they\'ve been influenced by magic.' },
		{ name: 'Pipe of Smoke Monsters', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While smoking this pipe, you can use an action to exhale a puff of smoke that takes the form of a single creature, such as a dragon, a flumph, or a froghemoth. The form must be small enough to fit in a 1-foot cube and loses its shape after a few seconds, becoming an ordinary puff of smoke.' },
		{ name: 'Pole of Angling', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While holding this 10-foot pole, you can speak a command word and transform it into a fishing pole with a hook, a line, and a reel. Speaking the command word again changes the fishing pole back into a normal 10-foot pole.' },
		{ name: 'Pole of Collapsing', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'While holding this 10-foot pole, you can use an action to speak a command word and cause it to collapse into a 1-foot-long rod, for ease of storage. The pole\'s weight doesn\'t change. You can use an action to speak a different command word to cause the rod to revert to a pole; however, the rod will not elongate if there isn\'t space for it to do so.' },
		{ name: 'Pot of Awakening', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'If you plant an ordinary shrub in this 10-pound clay pot and let it grow for 30 days, the shrub magically transforms into an awakened shrub at the end of that time. When the shrub awakens, its roots break the pot, destroying it. The awakened shrub is friendly to you and your companions.' },
		{ name: 'Rope of Mending', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'You can cut this 50-foot coil of hempen rope into any number of smaller pieces, and then use an action to speak a command word and cause the pieces to knit back together. The pieces must be in contact with each other and not otherwise in use. As long as the rope is one piece, it regains its full length.' },
		{ name: 'Ruby of the War Mage', source: 'XGtE', page: 139, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes (Spellcaster)', cost: '75 gp', description: 'Etched with eldritch runes, this 1-inch-diameter ruby allows you to use a simple or martial weapon as a spellcasting focus for your spells. For this property to work, you must attach the ruby to the weapon by pressing the ruby against it for at least 10 minutes. Thereafter, the ruby can\'t be removed unless you detach it as an action or the weapon is destroyed.' },
		{ name: 'Talking Doll', source: 'XGtE', page: 140, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'While this stuffed doll is within 5 feet of you, you can spend a short rest telling it to say up to six phrases, none of which can be more than six words long, and set a condition under which the doll speaks each phrase. You can also replace old phrases with new ones. Whatever the condition, it must occur within 5 feet of the doll to make it speak. Once the doll speaks a phrase, that phrase cannot be repeated until the next dawn.' },
		{ name: 'Tankard of Sobriety', source: 'XGtE', page: 140, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This tankard has a stern face sculpted into one side. You can drink ale, wine, or any other nonmagical alcoholic beverage poured into it without becoming inebriated. The tankard has no effect on magical beverages or harmful substances such as poison.' },
		{ name: 'Veteran\'s Cane', source: 'XGtE', page: 140, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'When you grasp this walking cane and use a bonus action to speak the command word, it transforms into an ordinary longsword and ceases to be magical.' },
		// ── Tasha's Cauldron of Everything (TCoE) ────────────────────────────────
		// WEAPONS
		{ name: 'Moon Sickle', source: 'TCoE', page: 133, type: 'Weapon', rarity: 'Uncommon', attunement: 'Yes (Druid/Ranger)', cost: '400 gp', description: 'You gain a +1 bonus to attack and damage rolls made with this magic weapon, and you gain a +1 bonus to spell attack rolls while you hold it. The weapon\'s bonus increases to +2 at Rare rarity and +3 at Very Rare rarity. In addition, you can use the weapon as a spellcasting focus for your druid or ranger spells.' },
		{ name: 'Devotee\'s Censer', source: 'TCoE', page: 127, type: 'Weapon', rarity: 'Rare', attunement: 'Yes (Cleric/Paladin)', cost: '2,000 gp', description: 'This thurible functions as a holy symbol and magic flail. When you hit a creature with it, that creature takes an extra 2d8 radiant damage. As a bonus action, you can speak the censer\'s command word to cause it to emanate a thin cloud of smoke for 1 minute that grants creatures within 10 feet of it advantage on death saving throws. Once used, this property can\'t be used again until the next dawn.' },
		{ name: 'Lyre of Building', source: 'TCoE', page: 133, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Bard)', cost: '2,000 gp', description: 'While holding this lyre, you can cast mending as a bonus action. You can also play the lyre as an action to cast fabricate, move earth, passwall, or summon construct spell, expending charges as necessary. The lyre regains charges at dawn. When you play it, you can also use it as a spellcasting focus for your bard spells.' },
		// WONDROUS ITEMS (Common)
		{ name: 'Illuminator\'s Tattoo', source: 'TCoE', page: 129, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'This tattoo contains a writing instrument in its abstract lines. While wearing this tattoo with the needle in hand, you can write with your fingertip as though holding a quill, ink, and paper. Writing created by the tattoo is invisible to everyone other than you; others can see it only with help from magic (such as detect magic or see invisibility).' },
		{ name: 'Masquerade Tattoo', source: 'TCoE', page: 131, type: 'Wondrous Item', rarity: 'Common', attunement: 'Yes', cost: '75 gp', description: 'While this tattoo is on your skin, you can use a bonus action to change the tattoo\'s color and pattern, and you can alter minor features of your appearance. Once altered, the changes remain until you alter them again. You can also use the tattoo to cast disguise self once per day, and the spell lasts for 1 hour.' },
		{ name: 'Prosthetic Limb', source: 'TCoE', page: 134, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This item replaces a lost limb — a hand, an arm, a foot, a leg, or a similar body part. While the prosthetic is attached, it functions identically to the part it replaces. You can detach or reattach it as an action, and it can\'t be removed against your will. It detects as magical, but it is not a focus or otherwise magical for your spells.' },
		{ name: 'Spellwrought Tattoo', source: 'TCoE', page: 135, type: 'Wondrous Item', rarity: 'Common', attunement: 'No', cost: '75 gp', description: 'This tattoo contains a single spell of up to 5th level, wrought on your skin by a magic needle. To use the tattoo, you must hold the needle against your skin where you want the tattoo to appear and speak the command word. The needle then becomes ink that becomes the tattoo, and you can cast the chosen spell once. The tattoo vanishes from your skin when you do so.' },
		// WONDROUS ITEMS (Uncommon)
		{ name: 'All-Purpose Tool', source: 'TCoE', page: 119, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Artificer)', cost: '400 gp', description: 'This simple screwdriver can transform into any type of artisan\'s tool you decide, changing shape and size as needed. You can use the tool as a spellcasting focus for your artificer spells. You gain a +1 bonus to spell attack rolls and to the saving throw DCs of your artificer spells. The bonus increases to +2 at Rare and +3 at Very Rare rarity.' },
		{ name: 'Amulet of the Devout', source: 'TCoE', page: 119, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Cleric/Paladin)', cost: '400 gp', description: 'You gain a +1 bonus to spell attack rolls and the saving throw DCs of your spells while you wear this amulet. You can use the amulet as a holy symbol. You gain 1 additional use of your Channel Divinity between rests while you wear this amulet. The bonus increases to +2 at Rare and +3 at Very Rare rarity.' },
		{ name: 'Arcane Grimoire', source: 'TCoE', page: 119, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Wizard)', cost: '400 gp', description: 'While you are holding this leather-bound book, you can use it as a spellcasting focus for your wizard spells, and you gain a +1 bonus to spell attack rolls and the saving throw DCs of your wizard spells. You can use this book as your spellbook. You can also use this book\'s Arcane Recovery feature to recover an additional spell slot level per long rest. The bonus increases to +2 at Rare and +3 at Very Rare rarity.' },
		{ name: 'Barrier Tattoo', source: 'TCoE', page: 122, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While not wearing armor, this tattoo grants you an Armor Class of 12 plus your Dexterity modifier. At Rare rarity, your AC becomes 15 plus your Dexterity modifier. At Very Rare rarity, your AC becomes 18 (this version doesn\'t use your Dexterity modifier).' },
		{ name: 'Bloodwell Vial', source: 'TCoE', page: 122, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Sorcerer)', cost: '400 gp', description: 'To attune to this vial, you must place a few drops of your blood into it. The vial can\'t be opened while your attunement to it lasts. While you are attuned to this vial, you gain a +1 bonus to spell attack rolls and the saving throw DCs of your sorcerer spells, and you regain 5 sorcery points whenever you finish a long rest. The bonus increases to +2 at Rare and +3 at Very Rare rarity.' },
		{ name: 'Coiling Grasp Tattoo', source: 'TCoE', page: 122, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'This tattoo depicts chains and shackles. While the tattoo is on your skin, you can use an action to animate it, causing inky tendrils to reach out from you. Choose one creature you can see within 15 feet of you. The creature must succeed on a DC 14 Strength saving throw or be grappled by you for up to 1 minute. Once you use this property, it can\'t be used again until the next dawn.' },
		{ name: 'Eldritch Claw Tattoo', source: 'TCoE', page: 126, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', cost: '400 gp', description: 'While this tattoo is on your skin, your unarmed strikes are considered magical for the purpose of overcoming immunity and resistance to nonmagical attacks and damage. The tattoo also has 6 charges, and you can expend 1 charge as a bonus action to empower your unarmed strikes for 1 minute; during this time your reach with unarmed strikes increases by 15 feet.' },
		{ name: 'Feywild Shard', source: 'TCoE', page: 127, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Sorcerer)', cost: '400 gp', description: 'This warm crystal glows with a soft golden light. While you hold the shard, you can use it as a spellcasting focus. When you use a Metamagic option while holding the shard, roll on the Wild Magic Surge table. If the result is a spell, it is too wild to be cast and doesn\'t happen, but note the number; a wild magic surge will occur the next time you cast a spell of 1st level or higher.' },
		{ name: 'Guardian Emblem', source: 'TCoE', page: 128, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Cleric/Paladin)', cost: '400 gp', description: 'This emblem is the symbol of a deity or a spiritual tradition. While you wear this emblem, you can use your Channel Divinity feature to cast shield of faith on a creature as a bonus action instead of an action, and the spell\'s duration is 8 hours in this case. Once you use this property, it can\'t be used again until the next dawn.' },
		{ name: 'Nature\'s Mantle', source: 'TCoE', page: 133, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Druid/Ranger)', cost: '400 gp', description: 'This cloak shifts color and texture to blend with the terrain surrounding you. While wearing it, you can use a bonus action to cast pass without trace as a spell, and you can use the cloak as a spellcasting focus for your druid or ranger spells. Once you cast this spell with the cloak, you can\'t do so again until you finish a long rest.' },
		{ name: 'Rhythm-Maker\'s Drum', source: 'TCoE', page: 134, type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes (Bard)', cost: '400 gp', description: 'While you hold this drum, you can use it as a spellcasting focus for your bard spells, and you gain a +1 bonus to spell attack rolls and to the saving throw DCs of your bard spells. Additionally, once per long rest you can regain one use of your Bardic Inspiration feature. The bonus increases to +2 at Rare and +3 at Very Rare rarity.' },
		// WONDROUS ITEMS (Rare)
		{ name: 'Alchemical Compendium', source: 'TCoE', page: 119, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This tome is the prized possession of transmuters. While attuned to it, you gain these benefits: You can use the book as a spellcasting focus for your wizard spells. You gain advantage on Arcana checks involving transmutation magic. The book contains transmutation spells, and you can prepare an extra transmutation spell per day without it counting against the number of spells you can prepare.' },
		{ name: 'Astral Shard', source: 'TCoE', page: 120, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Sorcerer)', cost: '2,000 gp', description: 'This crystal is a sliver of the Astral Plane. While you hold this shard, you can use it as a spellcasting focus. When you use a Metamagic option while holding the shard, you can teleport to an unoccupied space you can see within 30 feet of you as part of the same reaction. Once you use this property, you can\'t use it again until the start of your next turn.' },
		{ name: 'Astromancy Archive', source: 'TCoE', page: 120, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This brass disc of interlocking rings holds the secrets of divination. While attuned to it, you can use it as a spellcasting focus for your wizard spells. The archive contains divination spells, and you can prepare an extra divination spell per day. When a creature you can see within 30 feet of you makes an attack roll, ability check, or saving throw, you can use your reaction to add or subtract 1d6 from the roll. You can do so after the roll but before the outcome is determined.' },
		{ name: 'Atlas of Endless Horizons', source: 'TCoE', page: 120, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This heavy tome is bound in travel-worn leather. While attuned to it, you can use it as a spellcasting focus for your wizard spells. The atlas contains conjuration spells, and you can prepare an extra conjuration spell per day. When a creature you can see targets you with an attack, you can use your reaction to teleport to an unoccupied space you can see within 30 feet of you, imposing disadvantage on the attack.' },
		{ name: 'Bell Branch', source: 'TCoE', page: 122, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Druid)', cost: '2,000 gp', description: 'This silver branch is covered in small bells and can function as a druidic focus. You can ring it to cast detect evil and good, detect magic, or detect poison and disease, without expending a spell slot. You can also ring it to cast protection from evil and good once per day. When you ring the bells, each creature within 60 feet of you that is an aberration, a celestial, a fey, a fiend, or an undead must make a DC 15 Wisdom saving throw; on a failed save, it has disadvantage on attack rolls against you for 1 minute.' },
		{ name: 'Duplicitous Manuscript', source: 'TCoE', page: 125, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'To you, this book looks like a magical spellbook for illusion wizards. To others, the book appears to contain bland philosophical musings. While attuned to this book, you can use it as a spellcasting focus for your wizard spells. The manuscript contains illusion spells, and you can prepare an extra illusion spell per day. When you cast an illusion spell of 1st level or higher, you can grant a creature you can see within 60 feet of you advantage on Charisma (Deception) checks until the end of your next turn.' },
		{ name: 'Elemental Essence Shard', source: 'TCoE', page: 126, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Sorcerer)', cost: '2,000 gp', description: 'This crackling crystal comes in four varieties — air, earth, fire, and water — each containing a sliver of elemental power. When you use a Metamagic option while holding the shard, you gain a bonus effect depending on the shard\'s element: air (push a creature), earth (restrain a creature), fire (deal extra fire damage), or water (restore hit points).' },
		{ name: 'Far Realm Shard', source: 'TCoE', page: 127, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Sorcerer)', cost: '2,000 gp', description: 'This twisted crystal is a shard of the alien Far Realm. While you hold the shard, you can use it as a spellcasting focus. When you use a Metamagic option while holding the shard, you can force a creature you can see within 30 feet to make a DC 15 Constitution saving throw; on a failed save, the creature takes 3d6 psychic damage and is frightened of you until the start of your next turn.' },
		{ name: 'Fulminating Treatise', source: 'TCoE', page: 128, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This book crackles with the energy of evocation. While attuned to it, you can use it as a spellcasting focus for your wizard spells. The treatise contains evocation spells, and you can prepare an extra evocation spell per day. When you cast an evocation spell of 1st level or higher, you can use your reaction to deal extra force damage equal to your Intelligence modifier to one target of the spell.' },
		{ name: 'Heart Weaver\'s Primer', source: 'TCoE', page: 128, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This book is a tome of enchantment study. While attuned to it, you can use it as a spellcasting focus for your wizard spells. The primer contains enchantment spells, and you can prepare an extra enchantment spell per day. When you target a creature with an enchantment spell of 1st level or higher, you can impose disadvantage on one saving throw the creature makes against the spell.' },
		{ name: 'Libram of Souls and Flesh', source: 'TCoE', page: 129, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This necromantic tome is bound in pale leather. While attuned to it, you can use it as a spellcasting focus for your wizard spells. The libram contains necromancy spells, and you can prepare an extra necromancy spell per day. When you cast a necromancy spell of 1st level or higher, you can temporarily gain resistance to necrotic damage until the end of your next turn.' },
		{ name: 'Outer Essence Shard', source: 'TCoE', page: 133, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Sorcerer)', cost: '2,000 gp', description: 'This glittering crystal comes in four varieties: celestial (good), fiend (evil), great old one (neutral), and shadow (dark). While you hold the shard and use a Metamagic option, you gain a special bonus effect depending on the shard\'s type; for example, the celestial shard allows you to grant a creature temporary hit points equal to your Charisma modifier.' },
		{ name: 'Planecaller\'s Codex', source: 'TCoE', page: 134, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This planar travel guide contains conjuration spells. While attuned to it, you can use it as a spellcasting focus for your wizard spells. You can prepare an extra conjuration spell per day. When you cast a conjuration spell that summons or creates a creature, that creature has advantage on its first attack roll, ability check, or saving throw.' },
		{ name: 'Protective Verses', source: 'TCoE', page: 134, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Wizard)', cost: '2,000 gp', description: 'This book radiates abjuration magic. While attuned to it, you can use it as a spellcasting focus for your wizard spells. The book contains abjuration spells, and you can prepare an extra abjuration spell per day. When you cast an abjuration spell of 1st level or higher, you can grant temporary hit points equal to twice your Intelligence modifier to a creature you can see within 60 feet of you.' },
		{ name: 'Reveler\'s Concertina', source: 'TCoE', page: 134, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Bard)', cost: '2,000 gp', description: 'While holding this concertina, you can use it as a spellcasting focus for your bard spells, and you gain a +2 bonus to the saving throw DCs of your bard spells. As an action, you can play the concertina to cast Otto\'s Irresistible Dance. Once this property is used, it can\'t be used again until the next dawn.' },
		{ name: 'Shadowfell Brand Tattoo', source: 'TCoE', page: 135, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes', cost: '2,000 gp', description: 'This tattoo is steeped in the gloom of the Shadowfell. While it is on your skin, you have darkvision out to 60 feet (or 30 feet more if you already have darkvision), and you have advantage on Dexterity (Stealth) checks. In addition, when you take damage, you can use your reaction to become partially incorporeal for a moment, halving the triggering damage. Once you use this reaction, it can\'t be used again until the next dawn.' },
		{ name: 'Shadowfell Shard', source: 'TCoE', page: 135, type: 'Wondrous Item', rarity: 'Rare', attunement: 'Yes (Sorcerer)', cost: '2,000 gp', description: 'This crystal is a sliver of the Shadowfell. While you hold the shard and use a Metamagic option, you can cast the hex spell on a creature you can see within 30 feet of you as a bonus action, without expending a spell slot or material components. Once you use this property, it can\'t be used again until the next dawn.' },
		// WONDROUS ITEMS (Very Rare)
		{ name: 'Absorbing Tattoo', source: 'TCoE', page: 119, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '10,000 gp', description: 'This tattoo covers your upper body. It is a damage-specific tattoo that comes in different colors based on damage type. While the tattoo is on your skin, you have resistance to the damage type associated with your tattoo. When you take damage of that type, you can use your reaction to ignore the damage and instead regain a number of hit points equal to half the damage you would have taken, up to 3d10+3. Once you use this reaction, it can\'t be used again until the next dawn.' },
		{ name: 'Cauldron of Rebirth', source: 'TCoE', page: 122, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes (Druid/Warlock)', cost: '10,000 gp', description: 'This Tiny pot bears relief images of skulls, bones, and beakers. Once per day, you can spend 1 minute to produce a potion of healing in the pot. While attuned to the cauldron and in contact with it, you can use it as a spellcasting focus. If a humanoid\'s corpse is placed in the cauldron and covered with 200 pounds of salt for 8 hours, the salt is consumed and the creature returns to life as if revivify had been cast on them.' },
		{ name: 'Crystalline Chronicle', source: 'TCoE', page: 124, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes (Wizard)', cost: '10,000 gp', description: 'An etched crystal ball, about the size of a grapefruit, this chronicle functions as a spellbook for you. While you are attuned to it, you can use it as a spellcasting focus, you can prepare three more spells than normal, and the crystal stores the spells you know. Additionally, once per day when you finish a long rest, you can change one spell in the crystal out for any wizard spell of the same level or lower.' },
		{ name: 'Ghost Step Tattoo', source: 'TCoE', page: 128, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '10,000 gp', description: 'This tattoo shows a ghostly figure. The tattoo has 3 charges, and it regains 1d3 expended charges daily at dawn. As a bonus action while the tattoo is on your skin, you can expend 1 of the tattoo\'s charges to become incorporeal until the end of your turn. While incorporeal, you have resistance to bludgeoning, piercing, and slashing damage, and you can move through other creatures and objects as if they were difficult terrain.' },
		{ name: 'Lifewell Tattoo', source: 'TCoE', page: 129, type: 'Wondrous Item', rarity: 'Very Rare', attunement: 'Yes', cost: '10,000 gp', description: 'This tattoo depicts the cycle of life and death. While it is on your skin, you have resistance to necrotic damage. In addition, when you are reduced to 0 hit points, you can expend a use of the tattoo to drop to 1 hit point instead, as if you had the death ward spell active. Once you use this property, it can\'t be used again until the next dawn.' },
		// WONDROUS ITEMS (Legendary / Artifact)
		{ name: 'Blood Fury Tattoo', source: 'TCoE', page: 122, type: 'Wondrous Item', rarity: 'Legendary', attunement: 'Yes', cost: '60,000 gp', description: 'This tattoo evokes fury in its form. It has 10 charges, and it regains all expended charges daily at dawn. When you hit a creature with a weapon attack, you can expend 1 charge to deal an extra 4d6 necrotic damage to the target, and you regain a number of hit points equal to the necrotic damage dealt. Additionally, when a creature you can see damages you, you can use your reaction to expend 1 charge and make a melee weapon attack against that creature with advantage.' },
		{ name: 'Baba Yaga\'s Mortar and Pestle', source: 'TCoE', page: 121, type: 'Wondrous Item', rarity: 'Artifact', attunement: 'Yes', cost: '—', description: 'This Artifact transforms into a mortar and pestle or a staff (as a bonus action). As a staff, it is a magic weapon that grants +3 to attack and damage. The mortar can be used to grind ingredients for a magical potion (1 hour). You can also use the artifact to travel up to 1,000 miles per day. The artifact has additional properties that can be discovered over time, and it has a random beneficial and detrimental effect while attuned.' },
		{ name: 'Crook of Rao', source: 'TCoE', page: 124, type: 'Wondrous Item', rarity: 'Artifact', attunement: 'Yes', cost: '—', description: 'This Artifact is the divine implement of Rao, god of peace and reason. While attuned, you can use the crook as a holy symbol and spellcasting focus. You can cast plane shift (to Elysium only), divine word, and hallow from the crook without material components. Once per day, you can use the crook to begin a 10-minute ritual that banishes all fiends within 1 mile that fail a DC 22 Charisma saving throw, sending them to their home plane for 100 years.' },
		{ name: 'Demonomicon of Iggwilv', source: 'TCoE', page: 125, type: 'Wondrous Item', rarity: 'Artifact', attunement: 'Yes', cost: '—', description: 'Tasha\'s great work, this Artifact contains lore about demons and the Abyss. While attuned, you can use the book as a spellcasting focus. You can cast a number of demon-related spells without material components, including magic circle and summon greater demon. Any fiend that can see you must make a DC 20 Wisdom save or be frightened of you for 1 minute. The book also has detrimental random effects and is sought after by demons.' },
		{ name: 'Luba\'s Tarokka of Souls', source: 'TCoE', page: 129, type: 'Wondrous Item', rarity: 'Artifact', attunement: 'Yes', cost: '—', description: 'This card deck of mysterious origin contains the souls of beings from across the planes. As an action, you can draw a card; if the card depicts a monster, that creature\'s soul grants you temporary hit points equal to its challenge rating or imposes a penalty on a target. You can use it to grant advantage or disadvantage on attack rolls, saves, or ability checks against a creature you can see for 1 hour (once per day).' },
		{ name: 'Mighty Servant of Leuk-o', source: 'TCoE', page: 131, type: 'Wondrous Item', rarity: 'Artifact', attunement: 'Yes', cost: '—', description: 'This Artifact is a mechanical giant (Huge construct), which you pilot from a cockpit inside. The construct has AC 20, 300 hit points, immunity to poison and psychic damage, and a Strength of 30. You can make up to 4 attacks with it per turn. While piloting it, you are blinded and deafened to your external environment, but can see and hear through the construct\'s senses. When the construct drops to 0 hit points, you must make a DC 17 Constitution save or drop to 0 hit points yourself.' },
		{ name: 'Teeth of Dahlver-Nar', source: 'TCoE', page: 135, type: 'Wondrous Item', rarity: 'Artifact', attunement: 'No', cost: '—', description: 'These 20 teeth each bear a monster\'s visage and contain a fragment of its soul. As an action, you can push one tooth into your own gum (requiring a successful attack against yourself); the tooth grafts to your jaw and grants a monstrous trait — one of 20 possible permanent boons, such as a bite attack, darkvision, or a breath weapon. Each tooth can only be implanted once. You can have up to 5 teeth implanted at one time.' },
	];

	let itemSearch = $state('');
	let itemTypeFilter = $state('All');
	let itemRarityFilter = $state('All');
	let itemSort = $state('name');
	let selectedMagicItem = $state<MagicItem | null>(null);

	const itemTypes = ['All', 'Armor', 'Potion', 'Ring', 'Rod', 'Staff', 'Wand', 'Weapon', 'Wondrous Item'];
	const itemRarities = ['All', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Varies'];
	const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Varies'];

	const rarityColor: Record<string, string> = {
		Common: 'text-gray-400 bg-gray-800/60',
		Uncommon: 'text-green-400 bg-green-950/40',
		Rare: 'text-blue-400 bg-blue-950/40',
		'Very Rare': 'text-purple-400 bg-purple-950/40',
		Legendary: 'text-amber-400 bg-amber-950/40',
		Artifact: 'text-red-400 bg-red-950/40',
		Varies: 'text-gray-400 bg-gray-800/60',
	};

	const filteredMagicItems = $derived(
		magicItems
			.filter((item) => {
				const q = itemSearch.toLowerCase();
				const matchSearch = !q || item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
				const matchType = itemTypeFilter === 'All' || item.type === itemTypeFilter;
				const matchRarity = itemRarityFilter === 'All' || item.rarity === itemRarityFilter;
				return matchSearch && matchType && matchRarity;
			})
			.sort((a, b) => {
				if (itemSort === 'rarity') {
					const diff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
					return diff !== 0 ? diff : a.name.localeCompare(b.name);
				}
				if (itemSort === 'source') {
					const diff = a.source.localeCompare(b.source);
					return diff !== 0 ? diff : a.name.localeCompare(b.name);
				}
				return a.name.localeCompare(b.name); // default: name A-Z
			})
	);

</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gray-950"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>
	<!-- Header -->
	<div class="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-6 py-3">
		<span class="text-xl">📖</span>
		<h2 class="text-lg font-black tracking-widest text-amber-400 uppercase">Quick Reference</h2>
		<p class="ml-2 hidden text-xs text-gray-500 sm:block">{ruleset === '2024' ? 'D&D 2024 combat reference' : 'D&D 5e combat reference'}</p>
		<button
			onclick={onclose}
			class="ml-auto rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
			title="Close"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Body -->
	<div class="flex min-h-0 flex-1">
		<!-- Left nav -->
		<nav class="w-52 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900/60 py-3">
			{#each categories as cat}
				<button
					onclick={() => (selected = cat.id)}
					class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition
					       {selected === cat.id
						? 'bg-amber-900/30 font-semibold text-amber-300'
						: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
				>
					<span class="text-base leading-none">{cat.icon}</span>
					{cat.label}
				</button>
			{/each}
		</nav>

		<!-- Right content panel -->
		<div class="min-w-0 flex-1 overflow-y-auto px-8 py-6">
			<!-- ── Actions in Combat ────────────────────────────────── -->
			{#if selected === 'actions'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Actions in Combat
				</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-36 pb-2 text-left font-semibold text-gray-400">Action</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#if ruleset === '2024'}
							{#each [['Attack', 'Make one attack (more with Extra Attack). Can replace one attack with a Grapple or Shove.'], ['Dash', 'Double your movement for the turn.'], ['Disengage', "Your movement doesn't provoke opportunity attacks this turn."], ['Dodge', 'Until the start of your next turn: attacks against you have disadvantage, you have advantage on DEX saves. Lost if incapacitated or speed drops to 0.'], ['Help', 'Aid a creature within 5 ft: give advantage on their next ability check or attack roll. Or aid another creature on a skill check they can see.'], ['Hide', 'Make a Stealth check. You become hidden if the result exceeds the passive Perception of any creature that could detect you.'], ['Influence', 'Make a Charisma check (Persuasion, Deception, Intimidation, or Performance) to alter a creature\'s attitude. Replaces some social interactions that were free actions in 2014.'], ['Magic', 'Cast a spell or use a magical item. Most spells with a casting time of 1 Action use this.'], ['Ready', 'Choose an action and a trigger. React to execute the action when the trigger occurs (before your next turn).'], ['Search', 'Devote attention to finding something — Perception or Investigation check.'], ['Study', 'Make an Investigation, Arcana, History, Medicine, Nature, or Religion check to recall information about a target or situation.'], ['Utilize', 'Use a non-weapon item (replaces "Use an Object"). Does not include attacking with a weapon.'], ['Use Class Feature', 'Activate a feature that requires an action (e.g. Second Wind).'], ['Improvise', 'Attempt any reasonable action not listed. DM sets the rules on the fly.']] as [action, desc]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{action}</td>
									<td class="py-2 text-gray-300">{desc}</td>
								</tr>
							{/each}
						{:else}
							{#each [['Attack', 'Make one attack (more with Extra Attack). Replace one attack with a grapple or shove.'], ['Dash', 'Double your movement for the turn.'], ['Disengage', "Your movement doesn't provoke opportunity attacks this turn."], ['Dodge', 'Attacks against you have disadvantage. DEX saves have advantage. Benefit lost if incapacitated or speed drops to 0.'], ['Help', 'Give an ally advantage on their next ability check or one attack roll against a creature within 5 ft of you.'], ['Hide', 'Make a Stealth check. You become hidden if you beat the DC.'], ['Ready', 'Choose an action and a trigger. React to execute the action when the trigger occurs (before your next turn).'], ['Search', 'Devote attention to finding something — Perception or Investigation check.'], ['Use an Object', 'Interact with a second object (first is free) or use a special item property.'], ['Cast a Spell', 'Cast any spell with a casting time of 1 action.'], ['Use Class Feature', 'Activate a feature that requires an action (e.g. Second Wind, Divine Smite prep).'], ['Improvise', 'Attempt any reasonable action not listed. DM sets the rules on the fly.']] as [action, desc]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{action}</td>
									<td class="py-2 text-gray-300">{desc}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>

				<!-- ── Bonus Actions ────────────────────────────────────── -->
			{:else if selected === 'bonus'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Bonus Actions
				</h3>
				<div
					class="mb-4 rounded-lg border border-amber-800/40 bg-amber-900/10 px-4 py-3 text-sm text-amber-200"
				>
					You may only take <strong>one bonus action per turn</strong>. A bonus action can only be
					taken when a feature, spell, or ability specifically grants one.
				</div>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-48 pb-2 text-left font-semibold text-gray-400">Source</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Bonus Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#if ruleset === '2024'}
							{#each [['Two-Weapon Fighting', 'Attack with your off-hand light weapon (no ability modifier to damage unless the Nick mastery property is used).'], ['Spell (bonus action)', 'Cast any spell with a casting time of 1 bonus action. You can also cast a leveled spell as your action on the same turn — the 2014 restriction is removed.'], ['Rogue — Cunning Action', 'Dash, Disengage, or Hide.'], ['Druid — Wild Shape', "Transform into a beast you've seen."], ['Monk — Flurry of Blows', 'Spend 1 Focus Point: two Unarmed Strikes.'], ['Monk — Patient Defense', 'Spend 1 Focus Point: take the Dodge action.'], ['Monk — Step of the Wind', 'Spend 1 Focus Point: Disengage or Dash; jump distance doubled.'], ['Paladin — Divine Smite', 'Expend a spell slot after hitting to add Radiant damage (now a bonus action, not automatic).'], ["Warlock — Hex / Hunter's Mark", 'Cast at normal casting time; move the curse/mark as bonus action.']] as [src, desc]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{src}</td>
									<td class="py-2 text-gray-300">{desc}</td>
								</tr>
							{/each}
						{:else}
							{#each [['Two-Weapon Fighting', 'Attack with your off-hand light weapon (no ability modifier to damage).'], ['Spell (bonus action)', "Cast any spell with a casting time of 1 bonus action. Can't cast another non-cantrip spell on the same turn."], ['Rogue — Cunning Action', 'Dash, Disengage, or Hide.'], ['Druid — Wild Shape', "Transform into a beast you've seen."], ['Monk — Flurry of Blows', 'Spend 1 ki: two unarmed strikes.'], ['Monk — Patient Defense', 'Spend 1 ki: take Dodge action as bonus.'], ['Monk — Step of the Wind', 'Spend 1 ki: Disengage or Dash; jump distance doubled.'], ['Paladin — Divine Smite', 'Expend a spell slot after hitting to add radiant damage.'], ["Warlock — Hex / Hunter's Mark", 'Cast at normal casting time; move the curse/mark as bonus action.']] as [src, desc]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{src}</td>
									<td class="py-2 text-gray-300">{desc}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>

				<!-- ── Movement & Position ──────────────────────────────── -->
			{:else if selected === 'movement'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Movement &amp; Position
				</h3>
				<div class="space-y-6 text-sm">
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">General Rules</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• Move up to your speed. You can split movement before and after your action.</li>
							<li>
								• <strong class="text-white">Difficult terrain</strong> costs 2 ft of movement per 1 ft
								traveled.
							</li>
							<li>
								• <strong class="text-white">Standing from prone</strong> costs half your speed.
							</li>
							<li>
								• <strong class="text-white">Crawling</strong> (while prone) costs 1 extra foot per foot
								moved.
							</li>
							<li>
								• <strong class="text-white">Climbing / Swimming</strong> costs 1 extra foot per foot
								unless you have a climb/swim speed.
							</li>
							<li>
								• <strong class="text-white">Jumping</strong> — long jump: STR score in feet (running
								start); high jump: 3 + STR modifier in feet.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Opportunity Attacks</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• Triggered when a hostile creature <strong class="text-white"
									>leaves your reach</strong
								> without Disengaging.
							</li>
							<li>• Reaction: make one melee attack against the creature.</li>
							<li>
								• Teleportation and being moved by another creature does <em>not</em> trigger OAs.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Squeezing Through Tight Spaces</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• A creature can squeeze through a space one size smaller than itself.</li>
							<li>• Costs 1 extra foot per foot moved.</li>
							<li>
								• Disadvantage on attack rolls and DEX saves; attacks against you have advantage.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Space &amp; Size</h4>
						<table class="w-full">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Size</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Space</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['Tiny', '2½ × 2½ ft'], ['Small', '5 × 5 ft'], ['Medium', '5 × 5 ft'], ['Large', '10 × 10 ft'], ['Huge', '15 × 15 ft'], ['Gargantuan', '20 × 20 ft or larger']] as [size, space]}
									<tr>
										<td class="py-1.5 pr-4 font-semibold text-white">{size}</td>
										<td class="py-1.5 text-gray-300">{space}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
				</div>

				<!-- ── Conditions ───────────────────────────────────────── -->
			{:else if selected === 'conditions'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Conditions
				</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-32 pb-2 text-left font-semibold text-gray-400">Condition</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Key Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Blinded', "Can't see. Attacks against it have advantage; its attacks have disadvantage. Auto-fail checks requiring sight."], ['Charmed', "Can't attack the charmer. Charmer has advantage on social ability checks against it."], ['Deafened', "Can't hear. Auto-fail checks requiring hearing."], ['Exhausted', 'See Exhaustion table. Removed by long rest (one level per rest).'], ['Frightened', "Disadvantage on ability checks and attacks while source is in line of sight. Can't willingly move closer to source."], ['Grappled', 'Speed = 0. Ends if grappler is incapacitated or if creature is moved out of reach.'], ['Incapacitated', "Can't take actions or reactions."], ['Invisible', "Can't be seen normally. Attacks against it have disadvantage; its attacks have advantage. Location still detectable by noise."], ['Paralyzed', "Incapacitated; can't move or speak. Auto-fail STR/DEX saves. Attacks against it have advantage. Hits within 5 ft are critical hits."], ['Petrified', "Transformed to stone; incapacitated; can't move or speak; unaware of surroundings. Resistance to all damage; immune to poison/disease. Auto-fail STR/DEX saves. Attacks have advantage."], ['Poisoned', 'Disadvantage on attack rolls and ability checks.'], ['Prone', 'Can only crawl or stand up (costs half speed). Disadvantage on attack rolls. Melee attacks against it have advantage; ranged attacks have disadvantage.'], ['Restrained', 'Speed = 0. Attacks against it have advantage; its attacks have disadvantage. Disadvantage on DEX saves.'], ['Stunned', "Incapacitated; can't move; can only speak falteringly. Auto-fail STR/DEX saves. Attacks against it have advantage."], ['Unconscious', "Incapacitated; can't move or speak; unaware of surroundings. Drops held items; falls prone. Auto-fail STR/DEX saves. Attacks have advantage; hits within 5 ft are critical."]] as [cond, desc]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{cond}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- ── Concentration ────────────────────────────────────── -->
			{:else if selected === 'concentration'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Concentration
				</h3>
				<div class="space-y-4 text-sm text-gray-300">
					<p>
						Maintaining a concentration spell requires focus. Only <strong class="text-white"
							>one concentration spell</strong
						> may be active at a time — casting a second automatically ends the first.
					</p>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Concentration Breaks When…</h4>
						<ul class="space-y-1.5">
							<li>
								• <strong class="text-white">Damage taken</strong> — CON saving throw DC = max(10, ½ damage
								taken). Round down.
							</li>
							<li>
								• <strong class="text-white">Multiple hits same turn</strong> — separate save for each
								hit.
							</li>
							<li>• <strong class="text-white">Incapacitated or killed.</strong></li>
							<li>
								• <strong class="text-white">DM discretion</strong> — e.g. knocked prone by a large wave,
								crashing through a window.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">CON Save DC Quick Reference</h4>
						<table class="w-full max-w-xs">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Damage Taken</th>
									<th class="pb-2 text-left font-semibold text-gray-400">DC</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['1–19', '10'], ['20–21', '10'], ['22–23', '11'], ['24–25', '12'], ['26–27', '13'], ['28–29', '14'], ['30–31', '15'], ['40–41', '20'], ['50+', '25']] as [dmg, dc]}
									<tr>
										<td class="py-1.5 pr-4 text-white">{dmg}</td>
										<td class="py-1.5 font-bold text-amber-300">{dc}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Keeping Concentration</h4>
						<ul class="space-y-1.5">
							<li>
								• <strong class="text-white">War Caster feat</strong>: advantage on CON saves to
								maintain concentration.
							</li>
							<li>
								• <strong class="text-white">Resilient (Constitution) feat</strong>: proficiency on
								CON saves.
							</li>
							<li>• Concentration spells still require verbal/somatic components to cast.</li>
						</ul>
					</section>
				</div>

				<!-- ── Death Saving Throws ──────────────────────────────── -->
			{:else if selected === 'death'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Death Saving Throws
				</h3>
				<div class="space-y-4 text-sm text-gray-300">
					<p>
						When a creature drops to <strong class="text-white">0 HP</strong>, it falls unconscious
						and begins making death saving throws at the start of each of its turns. No ability
						modifier applies.
					</p>
					<table class="w-full max-w-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-2 text-left font-semibold text-gray-400">Roll</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Result</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['Nat 1', '2 failures'], ['2–9', '1 failure'], ['10–19', '1 success'], ['Nat 20', 'Regain 1 HP; stand up immediately']] as [roll, result]}
								<tr>
									<td class="py-1.5 pr-4 font-semibold text-white">{roll}</td>
									<td class="py-1.5 text-gray-300">{result}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<ul class="space-y-1.5">
						<li>
							• <strong class="text-white">3 successes</strong> — stabilized (unconscious but no longer
							dying).
						</li>
						<li>• <strong class="text-white">3 failures</strong> — dead.</li>
						<li>
							• <strong class="text-white">Taking damage at 0 HP</strong> — 1 failure (critical hit =
							2 failures).
						</li>
						<li>
							• <strong class="text-white">Massive damage</strong> — if damage from a single hit equals
							or exceeds max HP, instant death.
						</li>
						<li>• Stabilized creatures regain 1 HP after 1d4 hours if not healed first.</li>
						<li>• Successes and failures reset when the creature regains any HP.</li>
					</ul>
				</div>

				<!-- ── Exhaustion ───────────────────────────────────────── -->
			{:else if selected === 'exhaustion'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Exhaustion
				</h3>
				{#if ruleset === '2024'}
					<p class="mb-4 text-sm text-gray-300">
						Each level of Exhaustion applies a cumulative <strong class="text-white">−1 penalty</strong>
						to all d20 Tests (ability checks, attack rolls, saving throws) and to your
						<strong class="text-white">spell save DC</strong>. A long rest removes
						<strong class="text-white">one level</strong>.
					</p>
					<table class="w-full max-w-md text-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="w-16 pb-2 text-left font-semibold text-gray-400">Level</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Additional Effect</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['1', '−1 to all d20 Tests and spell save DCs'], ['2', '−2 to all d20 Tests and spell save DCs'], ['3', '−3 to all d20 Tests and spell save DCs'], ['4', '−4 to all d20 Tests and spell save DCs'], ['5', '−5 to all d20 Tests and spell save DCs; Speed halved'], ['6', '−6 to all d20 Tests and spell save DCs'], ['7', '−7 to all d20 Tests and spell save DCs'], ['8', '−8 to all d20 Tests and spell save DCs'], ['9', '−9 to all d20 Tests and spell save DCs'], ['10', 'Death']] as [lvl, effect]}
								<tr>
									<td class="py-2 pr-4 text-lg font-black text-amber-300">{lvl}</td>
									<td class="py-2 text-gray-300 {lvl === '10' ? 'font-semibold text-red-400' : ''}"
										>{effect}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
					<p class="mt-4 text-xs text-gray-500">
						Common sources: forced march, starvation, some spells and monster abilities. The
						Exhausted condition in 2024 works on a single stacking scale rather than six discrete
						tiers.
					</p>
				{:else}
					<p class="mb-4 text-sm text-gray-300">
						Effects are cumulative. A long rest removes <strong class="text-white">one level</strong> of
						exhaustion (requires food and water).
					</p>
					<table class="w-full max-w-md text-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="w-16 pb-2 text-left font-semibold text-gray-400">Level</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['1', 'Disadvantage on ability checks'], ['2', 'Speed halved'], ['3', 'Disadvantage on attack rolls and saving throws'], ['4', 'Hit point maximum halved'], ['5', 'Speed reduced to 0'], ['6', 'Death']] as [lvl, effect]}
								<tr>
									<td class="py-2 pr-4 text-lg font-black text-amber-300">{lvl}</td>
									<td class="py-2 text-gray-300 {lvl === '6' ? 'font-semibold text-red-400' : ''}"
										>{effect}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
					<p class="mt-4 text-xs text-gray-500">
						Common sources: forced march, swimming in armor, starvation, some spells and monster
						abilities.
					</p>
				{/if}

				<!-- ── Cover ────────────────────────────────────────────── -->
			{:else if selected === 'cover'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Cover</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-44 pb-2 text-left font-semibold text-gray-400">Type</th>
							<th class="w-24 pb-2 text-left font-semibold text-gray-400">Bonus</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Examples</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Half Cover', '+2 AC &amp; DEX saves', 'Low wall, large furniture, another creature'], ['Three-Quarters Cover', '+5 AC &amp; DEX saves', 'Portcullis, arrow slit, thick tree trunk'], ['Full Cover', "Can't be targeted", 'Completely hidden behind a solid barrier']] as [type, bonus, examples]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{type}</td>
								<td class="py-2 pr-4 align-top font-bold text-amber-300">{@html bonus}</td>
								<td class="py-2 text-gray-400">{examples}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="mt-4 text-sm text-gray-400">
					A target has cover based on the <strong class="text-white"
						>most obstructing obstacle</strong
					> between attacker and target. Cover only applies if the obstacle is between the attacker's
					position and the target — draw a line from the attacker to the target to determine.
				</p>

				<!-- ── Light & Vision ───────────────────────────────────── -->
			{:else if selected === 'light'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Light &amp; Vision
				</h3>
				<div class="space-y-5 text-sm">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="w-44 pb-2 text-left font-semibold text-gray-400">Light Level</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['Bright Light', 'Normal vision for all creatures.'], ['Dim Light', 'Lightly obscured. Disadvantage on Perception checks relying on sight.'], ['Darkness', 'Heavily obscured. Creatures effectively blinded unless they have Darkvision or Truesight.']] as [light, effect]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{light}</td>
									<td class="py-2 text-gray-300">{effect}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="w-44 pb-2 text-left font-semibold text-gray-400">Vision Type</th>
								<th class="pb-2 text-left font-semibold text-gray-400">What It Does</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['Darkvision', 'Treat darkness as dim light (can see in B&amp;W) up to range. Dim light still treated as dim light.'], ['Blindsight', 'Perceive surroundings without relying on sight up to range. Unaffected by invisibility or darkness.'], ['Tremorsense', 'Detect vibrations; can sense creatures in contact with the same ground up to range.'], ['Truesight', 'See in magical darkness, see invisible creatures, see into the Ethereal Plane, and detect illusions/shapechangers up to range.']] as [type, desc]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{type}</td>
									<td class="py-2 text-gray-300">{@html desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">Obscurement</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Lightly obscured</strong> (dim light, patchy fog, foliage):
								disadvantage on Perception checks relying on sight.
							</li>
							<li>
								• <strong class="text-white">Heavily obscured</strong> (darkness, dense fog, thick foliage):
								effectively blinded.
							</li>
						</ul>
					</div>
				</div>

				<!-- ── Resting ───────────────────────────────────────────── -->
			{:else if selected === 'resting'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Resting</h3>
				<div class="space-y-5 text-sm text-gray-300">
					<section class="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
						<h4 class="mb-2 font-black text-gray-100">
							Short Rest <span class="ml-2 font-normal text-gray-500">— 1+ hour</span>
						</h4>
						<ul class="space-y-1.5">
							<li>
								• Spend any number of <strong class="text-white">Hit Dice</strong>: roll each + CON
								modifier; regain that many HP.
							</li>
							<li>
								• Recover class features that refresh on a short rest (e.g. Warlock spell slots,
								Monk ki, Fighter Action Surge &amp; Second Wind).
							</li>
							<li>• Can be interrupted — requires 1 uninterrupted hour to benefit.</li>
						</ul>
					</section>
					<section class="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
						<h4 class="mb-2 font-black text-gray-100">
							Long Rest <span class="ml-2 font-normal text-gray-500">— 8 hours (6+ sleeping)</span>
						</h4>
						<ul class="space-y-1.5">
							<li>• Regain <strong class="text-white">all HP</strong>.</li>
							<li>
								• Regain <strong class="text-white">spent Hit Dice</strong> up to half your maximum (minimum
								1).
							</li>
							<li>
								• Regain <strong class="text-white">all spell slots</strong> and expended class features.
							</li>
							<li>
								• Remove <strong class="text-white">one level of exhaustion</strong> (if fed and watered).
							</li>
							<li>
								• Can take a long rest only <strong class="text-white">once per 24 hours</strong>.
							</li>
							<li>• More than 1 hour of combat or strenuous activity interrupts the rest.</li>
						</ul>
					</section>
				</div>

				<!-- ── Ability Check DCs ─────────────────────────────────── -->
			{:else if selected === 'checks'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Ability Check DCs
				</h3>
				<table class="mb-6 w-full max-w-xs text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400">Difficulty</th>
							<th class="pb-2 text-left font-semibold text-gray-400">DC</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Very Easy', '5'], ['Easy', '10'], ['Medium', '15'], ['Hard', '20'], ['Very Hard', '25'], ['Nearly Impossible', '30']] as [diff, dc]}
							<tr>
								<td class="py-1.5 pr-4 text-white">{diff}</td>
								<td class="py-1.5 text-lg font-black text-amber-300">{dc}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="space-y-3 text-sm text-gray-300">
					<p>
						<strong class="text-white">Contested checks:</strong> both sides roll their relevant ability.
						Higher total wins. Ties go to the creature that initiated the contest.
					</p>
					<p>
						<strong class="text-white">Passive checks</strong> (e.g. Passive Perception) = 10 + all modifiers
						(including proficiency and advantage/disadvantage ±5).
					</p>
					<p>
						<strong class="text-white">Group checks:</strong> everyone rolls — if at least half the group
						succeeds, the group succeeds.
					</p>
				</div>

				<!-- ── Common Save DCs ───────────────────────────────────── -->
			{:else if selected === 'saves'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Common Save DCs
				</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-56 pb-2 text-left font-semibold text-gray-400">Save</th>
							<th class="pb-2 text-left font-semibold text-gray-400">DC Formula</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Spell save DC', '8 + proficiency bonus + spellcasting ability modifier'], ['Concentration save', 'max(10, ½ damage taken) — round down'], ['Grapple (escape)', "Grappler's Athletics vs. your Athletics or Acrobatics"], ['Shove (resist)', "Attacker's Athletics vs. your Athletics or Acrobatics"], ['Trap / environmental', 'Varies — typically DC 10–20 based on trap tier'], ['Poison (generic)', 'Typically DC 10–15; varies by source']] as [save, formula]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{save}</td>
								<td class="py-2 text-gray-300">{formula}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="mt-5 space-y-2 text-sm text-gray-300">
					<h4 class="font-semibold text-gray-200">Spell Save DC by Modifier &amp; Proficiency</h4>
					<table class="w-full max-w-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-1 text-left font-semibold text-gray-400">Modifier</th>
								{#each ['+2', '+3', '+4', '+5', '+6'] as prof}
									<th class="pb-1 text-center font-semibold text-gray-400">Prof {prof}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['+1', 11, 12, 13, 14, 15], ['+2', 12, 13, 14, 15, 16], ['+3', 13, 14, 15, 16, 17], ['+4', 14, 15, 16, 17, 18], ['+5', 15, 16, 17, 18, 19]] as [mod, ...dcs]}
								<tr>
									<td class="py-1 pr-2 font-semibold text-white">{mod}</td>
									{#each dcs as dc}
										<td class="py-1 text-center text-amber-200">{dc}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- ── Encounter Difficulty ──────────────────────────────── -->
			{:else if selected === 'xp'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Encounter Difficulty
				</h3>
				{#if ruleset === '2024'}
					<div class="space-y-5 text-sm">
						<p class="text-gray-300">
							2024 uses an <strong class="text-white">XP Budget</strong> system. Sum the XP of all
							monsters to get the encounter's total XP, then compare against the budget for your party
							size and desired difficulty. No multiplier.
						</p>
						<div>
							<h4 class="mb-2 font-semibold text-gray-200">XP Budget per Character (by Level)</h4>
							<table class="w-full max-w-lg">
								<thead>
									<tr class="border-b border-gray-700">
										<th class="w-16 pb-2 text-left font-semibold text-gray-400">Level</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Low</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Moderate</th>
										<th class="pb-2 text-right font-semibold text-gray-400">High</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Severe</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Deadly</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800 text-gray-300">
									{#each [[1, 50, 75, 100, 150, 200], [2, 100, 150, 200, 250, 350], [3, 150, 225, 400, 550, 700], [4, 250, 375, 500, 750, 1100], [5, 500, 750, 1100, 1700, 2700], [6, 600, 1000, 1400, 2100, 3200], [7, 750, 1100, 1700, 2600, 3900], [8, 1000, 1400, 2100, 3100, 4700], [9, 1300, 1600, 2400, 3700, 5400], [10, 1600, 1900, 2800, 4300, 6400], [11, 1900, 2400, 3600, 5400, 7800], [12, 2200, 3000, 4500, 6600, 9600], [13, 2600, 3400, 5100, 7800, 11200], [14, 2900, 3800, 5700, 8600, 12400], [15, 3300, 4300, 6400, 9800, 14000], [16, 3800, 4800, 7200, 10800, 15800], [17, 4500, 5900, 8800, 13200, 18800], [18, 5000, 6300, 9500, 14300, 20800], [19, 5500, 7300, 10900, 16100, 23000], [20, 6400, 8500, 12700, 19200, 27200]] as [lvl, low, mod, high, sev, dead]}
										<tr>
											<td class="py-1 pr-4 font-bold text-amber-300">{lvl}</td>
											<td class="py-1 text-right">{low}</td>
											<td class="py-1 text-right">{mod}</td>
											<td class="py-1 text-right text-orange-300">{high}</td>
											<td class="py-1 text-right text-red-300">{sev}</td>
											<td class="py-1 text-right text-red-500">{dead}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<p class="text-xs text-gray-500">
							Multiply each column by the number of characters in the party to get the total budget.
							Total monster XP ≥ budget = encounter meets that difficulty tier. No monster-count
							multiplier is used in 2024.
						</p>
					</div>
				{:else}
					<div class="space-y-5 text-sm">
						<div>
							<h4 class="mb-2 font-semibold text-gray-200">XP Thresholds per Character Level</h4>
							<table class="w-full max-w-lg">
								<thead>
									<tr class="border-b border-gray-700">
										<th class="w-16 pb-2 text-left font-semibold text-gray-400">Level</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Easy</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Medium</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Hard</th>
										<th class="pb-2 text-right font-semibold text-gray-400">Deadly</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800 text-gray-300">
									{#each [[1, 25, 50, 75, 100], [2, 50, 100, 150, 200], [3, 75, 150, 225, 400], [4, 125, 250, 375, 500], [5, 250, 500, 750, 1100], [6, 300, 600, 900, 1400], [7, 350, 750, 1100, 1700], [8, 450, 900, 1400, 2100], [9, 550, 1100, 1600, 2400], [10, 600, 1200, 1900, 2800], [11, 800, 1600, 2400, 3600], [12, 1000, 2000, 3000, 4500], [13, 1100, 2200, 3400, 5100], [14, 1250, 2500, 3800, 5700], [15, 1400, 2800, 4300, 6400], [16, 1600, 3200, 4800, 7200], [17, 2000, 3900, 5900, 8800], [18, 2100, 4200, 6300, 9500], [19, 2400, 4900, 7300, 10900], [20, 2800, 5700, 8500, 12700]] as [lvl, easy, med, hard, deadly]}
										<tr>
											<td class="py-1 pr-4 font-bold text-amber-300">{lvl}</td>
											<td class="py-1 text-right">{easy}</td>
											<td class="py-1 text-right">{med}</td>
											<td class="py-1 text-right text-orange-300">{hard}</td>
											<td class="py-1 text-right text-red-400">{deadly}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div>
							<h4 class="mb-2 font-semibold text-gray-200">Monster Count Multiplier</h4>
							<table class="w-full max-w-xs">
								<thead>
									<tr class="border-b border-gray-700">
										<th class="pb-2 text-left font-semibold text-gray-400">Monsters</th>
										<th class="pb-2 text-left font-semibold text-gray-400">Multiplier</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800 text-gray-300">
									{#each [['1', '×1'], ['2', '×1.5'], ['3–6', '×2'], ['7–10', '×2.5'], ['11–14', '×3'], ['15+', '×4']] as [n, mult]}
										<tr>
											<td class="py-1.5 pr-4 text-white">{n}</td>
											<td class="py-1.5 font-bold text-amber-300">{mult}</td>
										</tr>
									{/each}
								</tbody>
							</table>
							<p class="mt-2 text-xs text-gray-500">
								Compare total adjusted XP against the <em>party's</em> thresholds (sum each character's
								threshold). Small parties (≤2) move one bracket up; large parties (≥6) move one bracket
								down.
							</p>
						</div>
					</div>
				{/if}

				<!-- ── Magic & Casting ─────────────────────────────────── -->
			{:else if selected === 'magic'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Magic &amp; Casting
				</h3>
				<div class="space-y-6 text-sm">
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Casting Times</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-36 pb-2 text-left font-semibold text-gray-400">Time</th><th
										class="pb-2 text-left font-semibold text-gray-400">Notes</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#if ruleset === '2024'}
									{#each [['Action', 'Standard. Most spells use this.'], ['Bonus Action', 'Cast any spell with a casting time of 1 bonus action. You may also cast a leveled spell as your action on the same turn — the 2014 restriction is removed in 2024.'], ['Reaction', "On another creature's turn in response to a specific trigger defined in the spell (e.g. Shield, Counterspell)."], ['1 Minute +', 'Must use your Magic action every turn during casting; concentration required throughout. Interruption = slot lost.'], ['Ritual (+10 min)', 'No spell slot expended. Takes 10 extra minutes. Cannot be used in combat for an instant result.']] as [time, note]}
										<tr
											><td class="py-2 pr-4 align-top font-semibold text-white">{time}</td><td
												class="py-2 text-gray-300">{note}</td
											></tr
										>
									{/each}
								{:else}
									{#each [['Action', 'Standard. Most spells use this.'], ['Bonus Action', 'If you cast a bonus-action spell, your action that turn can only be used to cast a cantrip (2014 rules).'], ['Reaction', "On another creature's turn in response to a specific trigger defined in the spell (e.g. Shield, Counterspell)."], ['1 Minute +', 'Must use your action every turn during casting; concentration required throughout. Interruption = slot lost.'], ['Ritual (+10 min)', 'No spell slot expended. Takes 10 extra minutes. Cannot be used in combat for an instant result.']] as [time, note]}
										<tr
											><td class="py-2 pr-4 align-top font-semibold text-white">{time}</td><td
												class="py-2 text-gray-300">{note}</td
											></tr
										>
									{/each}
								{/if}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Ritual Casting</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-36 pb-2 text-left font-semibold text-gray-400">Class</th><th
										class="pb-2 text-left font-semibold text-gray-400">Requirement</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['Wizard', 'Any ritual tag spell in spellbook — no preparation required. Spellbook must be on hand.'], ['Cleric / Druid', 'Must have the spell prepared that day.'], ['Bard', 'Must know the spell.'], ['Ranger / Paladin', 'Cannot ritual cast by default.'], ['Ritual Caster feat', 'Any class; grants a ritual book with two spells; more can be added. No preparation required.']] as [cls, req]}
									<tr
										><td class="py-2 pr-4 align-top font-semibold text-white">{cls}</td><td
											class="py-2 text-gray-300">{req}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Components</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-28 pb-2 text-left font-semibold text-gray-400">Component</th><th
										class="pb-2 text-left font-semibold text-gray-400">Requirement &amp; Bypass</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['V — Verbal', 'Must speak aloud at normal volume. Blocked by Silence spell, gag, or inability to speak.'], ['S — Somatic', 'Precise hand gesture; one free hand required. War Caster feat bypasses this restriction.'], ['M — Material', 'Item must be on hand. No-cost, non-consumed materials: substitute with component pouch (25 gp) or spellcasting focus. If the component has a listed gp cost or is consumed by the spell, the actual item is required — no substitutes.']] as [comp, rule]}
									<tr
										><td class="py-2 pr-4 align-top font-bold text-amber-300">{comp}</td><td
											class="py-2 text-gray-300">{rule}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">
							Spell Ranges &amp; Ranged Attacks in Melee
						</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Self</strong> — affects only the caster or originates from
								them.
							</li>
							<li>
								• <strong class="text-white">Touch</strong> — must touch the target. Melee spell attack
								roll against an unwilling creature.
							</li>
							<li>
								• <strong class="text-white">Ranged</strong> — if a hostile creature is within 5 ft
								of you and can see you, you have <strong class="text-white">disadvantage</strong> on ranged
								spell attack rolls. Does not apply to saving-throw spells.
							</li>
						</ul>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Areas of Effect</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-24 pb-2 text-left font-semibold text-gray-400">Shape</th><th
										class="pb-2 text-left font-semibold text-gray-400">How it works</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['Cone', 'Widens from origin point. Width = distance from origin. 15-ft cone is ~3 squares wide at its far edge.'], ['Cube', 'Origin on a face; extends inward. 10-ft cube = 2×2 grid squares.'], ['Cylinder', 'Has a radius and height. Origin at center of circular base; origin point is included.'], ['Line', 'Straight path from origin with a length and width (typically 5 ft wide = 1 square).'], ['Sphere', 'Extends from origin in all directions. Origin included. 20-ft radius = 4 squares from center.']] as [shape, desc]}
									<tr
										><td class="py-2 pr-4 align-top font-semibold text-white">{shape}</td><td
											class="py-2 text-gray-300">{desc}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Attack Rolls vs. Saving Throws</h4>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
								<p class="mb-1 font-semibold text-white">Spell Attack Roll</p>
								<p class="mb-2 font-mono text-xs text-amber-300">d20 + ability mod + proficiency</p>
								<ul class="space-y-1 text-xs text-gray-300">
									<li>• Compare result to target AC</li>
									<li>• Nat 20 = critical hit (double dice)</li>
									<li>• Examples: Fire Bolt, Inflict Wounds</li>
								</ul>
							</div>
							<div class="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
								<p class="mb-1 font-semibold text-white">Saving Throw</p>
								<p class="mb-2 font-mono text-xs text-amber-300">
									DC = 8 + ability mod + proficiency
								</p>
								<ul class="space-y-1 text-xs text-gray-300">
									<li>• Target rolls d20 + their modifier vs. DC</li>
									<li>• Success: usually half damage; some spells have no effect</li>
									<li>• Failure: full effect</li>
								</ul>
							</div>
						</div>
						<p class="mt-2 text-xs text-gray-500">
							Spellcasting ability: INT (Wizard) · WIS (Cleric, Druid, Ranger) · CHA (Sorcerer,
							Warlock, Bard, Paladin)
						</p>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Slots &amp; Upcasting</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Cantrips (level 0)</strong> — no slot required; unlimited
								uses. Scale at character levels 5, 11, and 17.
							</li>
							<li>
								• <strong class="text-white">Upcasting</strong> — cast a spell with a higher-level slot;
								the spell uses that level for its effects. Only spells with an "At Higher Levels" clause
								benefit.
							</li>
							<li>
								• <strong class="text-white">Warlock slots</strong> — always cast at the caster's highest
								slot level; restored on a short rest.
							</li>
							<li>• Most full casters restore all slots on a long rest.</li>
						</ul>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Counterspell &amp; Dispel Magic</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-36 pb-2 text-left font-semibold text-gray-400">Spell</th><th
										class="pb-2 text-left font-semibold text-gray-400">How it works</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">Counterspell</td>
									<td class="space-y-0.5 py-2 text-gray-300">
										<div>
											Reaction · 60 ft · Trigger: a creature within range begins casting a spell.
										</div>
										<div>
											<strong class="text-white">3rd level or lower</strong> → automatic counter, no check.
										</div>
										<div>
											<strong class="text-white">4th level+</strong> → Spellcasting Ability check, DC
											= 10 + spell level. Upcast to match or exceed the spell level for an automatic counter.
										</div>
									</td>
								</tr>
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">Dispel Magic</td>
									<td class="space-y-0.5 py-2 text-gray-300">
										<div>Action · 120 ft · Target one creature, object, or magical effect.</div>
										<div>
											<strong class="text-white">3rd level or lower</strong> → automatically ends, no
											check.
										</div>
										<div>
											<strong class="text-white">4th level+</strong> → Spellcasting Ability check, DC
											= 10 + spell level. Upcast to match or exceed the spell level for an automatic end.
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Combining Magical Effects</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Different spells stack</strong> — effects from different
								spells add together while both are active.
							</li>
							<li>
								• <strong class="text-white">Same spell does not stack</strong> — if cast multiple times
								on the same target, only the most potent effect applies (e.g. two Bless spells → one set
								of bonus dice).
							</li>
							<li>
								• A spell bonus may still stack with a non-spell bonus from a class feature or item
								— DM judgment applies.
							</li>
						</ul>
					</section>
				</div>

			{:else if selected === 'items'}
				<div class="flex h-full flex-col gap-4">
					<h3 class="text-base font-black tracking-widest text-amber-400 uppercase">Magic Items List</h3>
					<!-- Controls row -->
					<div class="flex flex-wrap gap-3">
						<input
							bind:value={itemSearch}
							type="search"
							placeholder="Search items…"
							class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
						/>
						<select bind:value={itemTypeFilter} class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none">
							{#each itemTypes as t}<option value={t}>{t}</option>{/each}
						</select>
						<select bind:value={itemRarityFilter} class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none">
							{#each itemRarities as r}<option value={r}>{r}</option>{/each}
						</select>
						<select bind:value={itemSort} class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none">
							<option value="name">Sort: A–Z</option>
							<option value="rarity">Sort: Rarity</option>
							<option value="source">Sort: Book</option>
						</select>
						<span class="self-center text-xs text-gray-500">{filteredMagicItems.length} items</span>
					</div>
					<!-- Two-column layout: list + detail -->
					<div class="flex min-h-0 flex-1 gap-4">
						<!-- Item list -->
						<div class="w-72 shrink-0 overflow-y-auto rounded-xl border border-gray-800">
							{#each filteredMagicItems as item}
								<button
									onclick={() => selectedMagicItem = item}
									class="flex w-full flex-col gap-0.5 border-b border-gray-800 px-3 py-2.5 text-left transition hover:bg-gray-800 {selectedMagicItem?.name === item.name ? 'bg-amber-900/20' : ''}"
								>
									<span class="text-sm font-semibold text-white">{item.name}</span>
									<div class="flex items-center gap-2">
										<span class="text-xs text-gray-500">{item.type}</span>
										<span class="rounded px-1.5 py-0.5 text-[10px] font-bold {rarityColor[item.rarity]}">{item.rarity}</span>
									</div>
								</button>
							{/each}
							{#if filteredMagicItems.length === 0}
								<p class="p-4 text-sm text-gray-500">No items match your filters.</p>
							{/if}
						</div>
						<!-- Detail panel -->
						{#if selectedMagicItem}
							<div class="min-w-0 flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-5">
								<div class="mb-3 flex flex-wrap items-baseline gap-3">
									<h4 class="text-xl font-black text-white">{selectedMagicItem.name}</h4>
									<span class="rounded px-2 py-0.5 text-xs font-bold {rarityColor[selectedMagicItem.rarity]}">{selectedMagicItem.rarity}</span>
								</div>
								<div class="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
									<div><span class="text-gray-400">Type: </span><span class="text-white">{selectedMagicItem.type}</span></div>
									<div><span class="text-gray-400">Source: </span><span class="text-white">{selectedMagicItem.source} p. {selectedMagicItem.page}</span></div>
									<div><span class="text-gray-400">Attunement: </span><span class="text-white">{selectedMagicItem.attunement}</span></div>
									<div><span class="text-gray-400">Typical Cost: </span><span class="text-amber-300 font-semibold">{selectedMagicItem.cost}</span></div>
								</div>
								<hr class="mb-4 border-gray-700" />
								<p class="text-sm leading-relaxed text-gray-300">{selectedMagicItem.description}</p>
							</div>
						{:else}
							<div class="flex flex-1 items-center justify-center rounded-xl border border-gray-800 text-gray-600">
								<p class="text-sm">Select an item to view its details.</p>
							</div>
						{/if}
					</div>
				</div>

			{/if}
		</div>
	</div>
</div>

<style>
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}
	.orb-1 {
		width: min(65vw, 700px); height: min(65vw, 700px);
		background: rgba(88, 28, 135, 0.45);
		top: -15%; left: -12%;
		animation: orb-drift-1 24s ease-in-out infinite;
	}
	.orb-2 {
		width: min(55vw, 620px); height: min(55vw, 620px);
		background: rgba(30, 58, 138, 0.45);
		bottom: -18%; right: -10%;
		animation: orb-drift-2 30s ease-in-out infinite;
	}
	.orb-3 {
		width: min(45vw, 520px); height: min(45vw, 520px);
		background: rgba(120, 53, 15, 0.35);
		top: 35%; left: 42%;
		transform: translate(-50%, -50%);
		animation: orb-drift-3 20s ease-in-out infinite;
	}
	.orb-4 {
		width: min(38vw, 440px); height: min(38vw, 440px);
		background: rgba(49, 46, 129, 0.4);
		top: 15%; right: 18%;
		animation: orb-drift-4 26s ease-in-out infinite;
	}
	@keyframes orb-drift-1 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		25%       { transform: translate(8vw, 6vh) scale(1.06); }
		55%       { transform: translate(3vw, 12vh) scale(0.94); }
		75%       { transform: translate(-3vw, 7vh) scale(1.03); }
	}
	@keyframes orb-drift-2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		30%      { transform: translate(-7vw, -9vh) scale(1.08); }
		65%      { transform: translate(-2vw, -4vh) scale(0.92); }
	}
	@keyframes orb-drift-3 {
		0%, 100% { transform: translate(-50%, -50%) scale(1); }
		40%      { transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1); }
		70%      { transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9); }
	}
	@keyframes orb-drift-4 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		35%      { transform: translate(6vw, 9vh) scale(0.94); }
		68%      { transform: translate(-5vw, 4vh) scale(1.06); }
	}
</style>
