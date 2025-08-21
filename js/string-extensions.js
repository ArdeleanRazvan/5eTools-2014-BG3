String.prototype.applySpeedIcons = function () {
    return this.replace(/(<span class="bold rd__list-item-name">Speed)(:)(<\/span>)/g, 
        '$1<img src="./img/statsicons/walk-icon.webp" width="20" height="20">$2$3');
};

String.prototype.applySizeIcons = function () {
    return this.replace(/(<span class="bold rd__list-item-name">Size)(:)(<\/span>)/g, 
        '$1<img src="./img/statsicons/creature-size-icon.webp" width="20" height="20">$2$3');
};

String.prototype.applySkillIcons = function () {
    return this.replace(
        /(<span[^>]*data-vet-hash="([^"]+)_phb"[^>]*>)([^<]+)(<\/span>)/g,
        function(match, openTag, skillHash, skillText, closeTag) {
            // Decode the hash and normalize it
            const decodedHash = decodeURIComponent(skillHash);
            const normalizedHash = decodedHash.toLowerCase().replace(/\s+/g, '');
            
            // Normalize the skill name for comparison
            const skillName = skillText.trim();
            const normalizedSkillName = skillName.toLowerCase().replace(/\s+/g, '');
            
            // Check if this is actually a skill by verifying the hash matches the skill name pattern
            if (normalizedHash === normalizedSkillName) {
                const iconName = skillName.toLowerCase().split(" ").join("-");
                const icon = `<img class="skill-icons" src="./img/skillsicons/${iconName}-icon.webp" width="20" height="20">`;
                return `${openTag}${icon}${skillText}${closeTag}`;
            }
            
            // If not a skill, return unchanged
            return match;
        }
    );
};

String.prototype.applyDamageIcons = function () {
	let result = this;
	let lastDamageType = null;
	
	// D&D 5e damage types
	const damageTypes = "bludgeoning|piercing|slashing|thunder|cold|fire|psychic|acid|poison|lightning|necrotic|radiant|force";
	
	// First pass: Handle explicit damage type spans and capture the damage type
	result = result.replace(
		/(<span[^>]*class="[^"]*roller render-roller[^"]*"[^>]*>)([^<]+)(<\/span>)\s*([a-zA-Z]+)\s+(damage)/g,
		function (match, openTag, diceText, closeTag, damageType, damageWord) {
			lastDamageType = damageType.toLowerCase(); // Store the damage type for later use
			const icon = `<img class="damage-icon" src="./img/damagetypes/${lastDamageType}_damage_icon.webp"/>`;
			// Add the damage type class to the existing class attribute
			const newOpenTag = openTag.replace(/class="([^"]*)"/, `class="$1 ${lastDamageType}-damage"`);
			return `${newOpenTag}${diceText}${icon}${damageType} ${damageWord}${closeTag}`;
		}
	);
	
	// Second pass: Handle dice rolls with multiple damage types (like "1d6 bludgeoning, piercing, or slashing damage")
	const multiDamageRegex = new RegExp(
		`(<span[^>]*class="[^"]*roller render-roller[^"]*"[^>]*>)([^<]+)(<\\/span>)\\s+(${damageTypes}),\\s+(${damageTypes}),?\\s+or\\s+(${damageTypes})\\s+(damage)`,
		'gi'
	);
	result = result.replace(
		multiDamageRegex,
		function (match, openTag, diceText, closeTag, firstType, secondType, thirdType, damageWord) {
			const firstTypeLower = firstType.toLowerCase();
			const secondTypeLower = secondType.toLowerCase();
			const thirdTypeLower = thirdType.toLowerCase();
			
			// Handle the first damage type with the dice roll
			const firstIcon = `<img class="damage-icon" src="./img/damagetypes/${firstTypeLower}_damage_icon.webp"/>`;
			const newOpenTag = openTag.replace(/class="([^"]*)"/, `class="$1 ${firstTypeLower}-damage"`);
			let result = `${newOpenTag}${diceText}${firstIcon}${firstType}${closeTag}`;
			
			// Handle the second damage type
			const secondIcon = `<img class="damage-icon" src="./img/damagetypes/${secondTypeLower}_damage_icon.webp"/>`;
			result += `, <span class="damage-type ${secondTypeLower}-damage">${secondIcon}${secondType}</span>`;
			
			// Handle the third damage type with "damage" word
			const thirdIcon = `<img class="damage-icon" src="./img/damagetypes/${thirdTypeLower}_damage_icon.webp"/>`;
			result += `, or <span class="damage-type ${thirdTypeLower}-damage">${thirdIcon}${thirdType} ${damageWord}</span>`;
			
			return result;
		}
	);
	
	// Second pass: Handle static damage text (like "5 cold damage")
	result = result.replace(
		/(?<!<span[^>]*>)\b(\d+)\s+([a-zA-Z]+)\s+(damage)\b(?![^<]*<\/span>)/g,
		function (match, damageAmount, damageType, damageWord) {
			const lowerType = damageType.toLowerCase();
			const icon = `<img class="damage-icon" src="./img/damagetypes/${lowerType}_damage_icon.webp"/>`;
			lastDamageType = lowerType; // Update the damage type for subsequent passes
			return `<span class="static-damage ${lowerType}-damage">${damageAmount}${icon}${damageType} ${damageWord}</span>`;
		}
	);
	
	// Third pass: Handle damage type without "damage" word (like "cold damage increase by 5")
	result = result.replace(
		/(?<!<span[^>]*>)\b([a-zA-Z]+)\s+damage\s+increase\s+by\s+(\d+)\b(?![^<]*<\/span>)/g,
		function (match, damageType, amount) {
			const lowerType = damageType.toLowerCase();
			const icon = `<img class="damage-icon" src="./img/damagetypes/${lowerType}_damage_icon.webp"/>`;
			lastDamageType = lowerType; // Update the damage type for subsequent passes
			return `<span class="damage-type ${lowerType}-damage">${icon}${damageType} damage</span> increase by <span class="damage-amount ${lowerType}-damage">${amount}</span>`;
		}
	);
	
	// Fourth pass: Handle bare roller spans that should inherit the damage type
	if (lastDamageType) {
		result = result.replace(
			/(<span[^>]*class="[^"]*roller render-roller[^"]*"[^>]*>)([^<]+)(<\/span>)(?!\s*[a-zA-Z]+\s+damage)/g,
			function (match, openTag, diceText, closeTag) {
				// Only add damage type class if it doesn't already have it
				if (!openTag.includes(`${lastDamageType}-damage`)) {
					const newOpenTag = openTag.replace(/class="([^"]*)"/, `class="$1 ${lastDamageType}-damage"`);
					return `${newOpenTag}${diceText}${closeTag}`;
				}
				return match;
			}
		);
	}
	
	// Fifth pass: Handle standalone damage type text (like "cold damage") outside of HTML attributes
	const standaloneDamageRegex = new RegExp(
		`(?<!<[^>]*)\\b(${damageTypes})\\s+(damage)\\b(?![^<]*<\\/span>)(?![^<]*">)`,
		"gi"
	);
	result = result.replace(
		standaloneDamageRegex,
		function (match, damageType, damageWord) {
			const lowerType = damageType.toLowerCase();
			const icon = `<img class="damage-icon" src="./img/damagetypes/${lowerType}_damage_icon.webp"/>`;
			return `<span class="damage-type ${lowerType}-damage">${icon}${damageType} ${damageWord}</span>`;
		}
	);
	
	// Sixth pass: Handle damage type lists (like "acid, cold, fire, lightning, or thunder")
	const damageListRegex = new RegExp(
		`\\b((?:(?:${damageTypes})(?:,\\s*|\\s+or\\s+))+(?:${damageTypes}))\\b(?![^<]*<\\/span>)(?![^<]*">)`,
		"gi"
	);
	result = result.replace(
		damageListRegex,
		function (match, damageList) {
			// Split the damage types and process each one
			const types = damageList.split(/,\s*|\s+or\s+/);
			let result = "";
			
			for (let i = 0; i < types.length; i++) {
				const type = types[i].trim();
				const lowerType = type.toLowerCase();
				const icon = `<img class="damage-icon" src="./img/damagetypes/${lowerType}_damage_icon.webp"/>`;
				
				// Add appropriate separator
				if (i > 0) {
					result += i === types.length - 1 ? ", or " : ", ";
				}
				
				result += `<span class="damage-type ${lowerType}-damage">${icon}${type}</span>`;
			}
			
			return result;
		}
	);
	
	return result;
};

String.prototype.applyHpIcons = function () {
	let result = this;
	
	// First pass: Handle numbered temporary hit points (like "5 temporary hit points")
	result = result.replace(
		/(?<!<span[^>]*>)\b(\d+)\s+(temporary\s+hit\s+points?)\b(?![^<]*<\/span>)/g,
		function (match, amount, tempHpText) {
			const icon = `<img class="temphp-icon" src="./img/othericons/temphp-icon.webp"/>`;
			return `<span class="temp-hp">${amount}${icon}${tempHpText}</span>`;
		}
	);
	
	// Second pass: Handle standalone "temporary hit points" text
	result = result.replace(
		/(?<!<span[^>]*>)\b(temporary\s+hit\s+points?)\b(?![^<]*<\/span>)/g,
		function (match, tempHpText) {
			const icon = `<img class="temphp-icon" src="./img/othericons/temphp-icon.webp"/>`;
			return `<span class="temp-hp">${icon}${tempHpText}</span>`;
		}
	);
	
	// Third pass: Handle numbered regular hit points (like "5 hit points" or "5 hit point")
	result = result.replace(
		/(?<!<span[^>]*>)\b(\d+)\s+(hit\s+points?)\b(?![^<]*<\/span>)/g,
		function (match, amount, hpText) {
			const icon = `<img class="temphp-icon" src="./img/othericons/temphp-icon.webp"/>`;
			return `<span class="temp-hp">${amount}${icon}${hpText}</span>`;
		}
	);
	
	// Fourth pass: Handle standalone "hit points" or "hit point" text
	result = result.replace(
		/(?<!<span[^>]*>)\b(hit\s+points?)\b(?![^<]*<\/span>)/g,
		function (match, hpText) {
			const icon = `<img class="temphp-icon" src="./img/othericons/temphp-icon.webp"/>`;
			return `<span class="temp-hp">${icon}${hpText}</span>`;
		}
	);
	
	return result;
};