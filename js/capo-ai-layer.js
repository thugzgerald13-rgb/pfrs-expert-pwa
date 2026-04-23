(function () {
  function normalize(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function titleCase(text) {
    return String(text || '')
      .toLowerCase()
      .split(' ')
      .map(word => word ? word[0].toUpperCase() + word.slice(1) : '')
      .join(' ');
  }

  function improveDraft(text, context = {}) {
    let result = String(text || '');
    if (!result.trim()) return 'No draft text available to improve.';

    result = result
      .replace(/\bP -\b/g, 'PHP [amount]')
      .replace(/\bNote X\b/gi, 'Note [number]')
      .replace(/\[Entity Name\]/g, context.entityName || '[Entity Name]');

    const improvements = [];
    if (!/management/i.test(result)) improvements.push('Added management-focused wording.');
    if (!/material/i.test(result)) improvements.push('Consider adding a materiality qualifier where appropriate.');
    if (!/reporting period|year ended|period ended/i.test(result)) improvements.push('Specify the reporting period in the final draft.');

    const polished = result
      .split(/\n{2,}/)
      .map(block => normalize(block))
      .filter(Boolean)
      .map(block => block.replace(/^(note\s+\d+\s*-\s*)(.*)$/i, (_, prefix, rest) => `${prefix}${titleCase(rest)}`))
      .join('\n\n');

    return `${polished}\n\nAI POLISH NOTES\n- ${improvements.join('\n- ') || 'Draft normalized for cleaner wording.'}`;
  }

  function explainReview(findings = [], missing = [], framework = '') {
    const lines = [];
    lines.push(`AI REVIEW EXPLANATION`);
    if (framework) lines.push(`Framework context: ${framework}`);
    lines.push('');

    if (missing.length) {
      lines.push('Why missing areas matter:');
      missing.forEach(item => {
        lines.push(`- ${item}: this disclosure helps align the financial statements with the expected framework and reduces reviewer follow-up.`);
      });
      lines.push('');
    }

    if (findings.length) {
      lines.push('What the findings mean:');
      findings.forEach(item => {
        lines.push(`- ${item}`);
      });
      lines.push('');
    }

    lines.push('Suggested action order:');
    lines.push('- Fix placeholders and note numbering first.');
    lines.push('- Add missing required notes next.');
    lines.push('- Reconcile balances and narrative wording last.');

    return lines.join('\n');
  }

  function suggestPrompts(missing = [], balances = {}) {
    const prompts = [];
    missing.slice(0, 6).forEach(item => {
      prompts.push(`Generate a ${item} note using my uploaded balances and make it audit-ready.`);
    });

    if (balances.revenue) prompts.push('Rewrite the revenue note using the detected revenue balance and mention the main performance obligations.');
    if (balances.ppe) prompts.push('Create a property and equipment note with net book value, depreciation context, and movement schedule placeholders.');
    if (balances.incomeTaxExpense || balances.deferredTax) prompts.push('Draft an income tax note with current tax, deferred tax, and reconciliation placeholders based on uploaded balances.');
    if (balances.leaseLiabilities || balances.rightOfUseAssets) prompts.push('Prepare a leases note covering right-of-use assets, lease liabilities, and maturity analysis.');

    return prompts;
  }

  function chatReply(message, context = {}) {
    const input = normalize(message).toLowerCase();
    const entityName = context.entityName || 'the entity';
    const balances = context.balances || {};

    if (!input) return 'Ask about notes, review findings, framework fit, or uploaded balances.';
    if (/missing|gap|weak/.test(input)) {
      return explainReview(context.findings || [], context.missing || [], context.framework || '');
    }
    if (/revenue/.test(input)) {
      return `Detected revenue for ${entityName} is approximately ${formatCurrency(balances.revenue)}. Use that amount as a starting point, then tailor the note to the actual contracts, billing terms, and performance obligations.`;
    }
    if (/tax/.test(input)) {
      return `Detected income tax expense is approximately ${formatCurrency(balances.incomeTaxExpense)} and deferred tax-related balances are approximately ${formatCurrency(balances.deferredTax)}. The final draft should still reconcile accounting profit to taxable income.`;
    }
    if (/ppe|property|equipment|asset/.test(input)) {
      const net = Number(balances.ppe || 0) - Math.abs(Number(balances.accumulatedDepreciation || 0));
      return `Detected property and equipment net balance is approximately ${formatCurrency(net)}. A final note should add rollforward details for beginning balance, additions, disposals, and depreciation.`;
    }
    if (/framework|pfrs|sme|micro/.test(input)) {
      return `Current framework context is ${context.framework || 'not yet determined'}. The AI layer uses that framework to prioritize missing disclosures and shape the notes pack.`;
    }

    return `For ${entityName}, I can help improve generated notes, explain review findings, or suggest the next disclosures to draft based on the uploaded balances.`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(value || 0));
  }

  window.CAPO_AI_LAYER = {
    improveDraft,
    explainReview,
    suggestPrompts,
    chatReply
  };
})();