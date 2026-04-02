// Disclosure Generator - SEC-Compliant Note Templates

function generateDisclosureText(type, entityName, context) {
  const templates = {
    compliance: generateComplianceStatement,
    basis: generateBasisOfPreparation,
    judgments: generateJudgmentsAndEstimates,
    ppe: generatePropertyAndEquipment,
    revenue: generateRevenueRecognition,
    related_party: generateRelatedPartyDisclosures,
    income_tax: generateIncomeTax,
    financial_risk: generateFinancialRisk,
    going_concern: generateGoingConcern,
    leases: generateLeases
  };
  
  const generator = templates[type];
  return generator ? generator(entityName, context) : 'Template not found';
}

function generateComplianceStatement(entityName, context) {
  const framework = detectFramework(
    parseFloat(document.getElementById('totalAssets')?.value) || 0,
    parseFloat(document.getElementById('totalLiabilities')?.value) || 0,
    document.getElementById('publiclyListed')?.value === 'true',
    document.getElementById('industrySector')?.value || 'general',
    0
  );
  
  return `NOTE 1 - STATEMENT OF COMPLIANCE WITH PHILIPPINE FINANCIAL REPORTING STANDARDS

The accompanying financial statements of ${entityName || '[Entity Name]'} have been prepared in compliance with ${framework.name} as issued by the Financial Reporting Standards Council (FRSC). These financial statements also comply with the applicable provisions of the Securities Regulation Code (SRC) Rule 68, as amended, and other relevant SEC Memorandum Circulars.

The financial statements were authorized for issue by the Board of Directors on ${new Date().toLocaleDateString()} and were approved by the stockholders on the same date.`;
}

function generateBasisOfPreparation(entityName, context) {
  return `NOTE 2 - BASIS OF PREPARATION

The financial statements have been prepared on a historical cost basis, except for the following assets and liabilities which are measured at fair value:
- Financial assets at fair value through profit or loss
- Financial assets at fair value through other comprehensive income
- Derivative financial instruments

The financial statements are presented in Philippine Pesos (PHP), which is the Company's functional currency. All values are rounded to the nearest thousand (PHP '000) except when otherwise indicated.

The preparation of financial statements in conformity with PFRS requires the use of certain critical accounting estimates. It also requires management to exercise its judgment in the process of applying the Company's accounting policies. The areas involving a higher degree of judgment or complexity, or areas where assumptions and estimates are significant to the financial statements are disclosed in Note [X] - Significant Accounting Judgments and Estimates.`;
}

function generateJudgmentsAndEstimates(entityName, context) {
  return `NOTE X - SIGNIFICANT ACCOUNTING JUDGMENTS AND ESTIMATES

The preparation of the financial statements requires management to make judgments, estimates and assumptions that affect the application of accounting policies and the reported amounts of assets, liabilities, income and expenses. Actual results may differ from these estimates.

**Judgments**

In the process of applying the Company's accounting policies, management has made the following judgments, apart from those involving estimations, which have the most significant effect on the amounts recognized in the financial statements:

a) **Determination of functional currency** - The Company's functional currency is Philippine Peso (PHP), which is the currency that mainly influences the prices of its goods and services and the cost of providing such goods and services.

b) **Classification of financial instruments** - The Company classifies its financial assets based on the business model for managing the assets and the contractual cash flow characteristics of the financial assets.

c) **Lease classification** - The Company determines whether an arrangement contains a lease at inception. For leases where the Company is the lessee, the Company assesses whether the lease transfers substantially all the risks and rewards of ownership.

**Key Sources of Estimation Uncertainty**

The following are the key assumptions concerning the future and other key sources of estimation uncertainty at the reporting date that have a significant risk of causing a material adjustment to the carrying amounts of assets and liabilities within the next financial year:

a) **Useful lives of property and equipment** - The Company estimates the useful lives of property and equipment based on the expected period of economic benefit. Changes in these estimates could affect depreciation expense and carrying values.

b) **Impairment of financial assets** - The Company assesses whether there is objective evidence of impairment on financial assets measured at amortized cost. The assessment involves significant judgment about future cash flows and economic conditions.

c) **Recognition of deferred tax assets** - The Company recognizes deferred tax assets only to the extent that it is probable that taxable profits will be available against which deductible temporary differences can be utilized.

d) **Provisions and contingencies** - The Company recognizes provisions when it has a present legal or constructive obligation as a result of past events, and it is probable that an outflow of resources will be required to settle the obligation.`;
}

function generatePropertyAndEquipment(entityName, context) {
  const currentYear = new Date().getFullYear();
  const priorYear = currentYear - 1;
  
  return `NOTE X - PROPERTY AND EQUIPMENT

Property and equipment are carried at cost less accumulated depreciation and any accumulated impairment losses. Land is not depreciated. Depreciation on other assets is computed on a straight-line basis over the estimated useful lives, as follows:

| Asset Category | Useful Life | Residual Value | Depreciation Method |
|----------------|-------------|----------------|---------------------|
| Building | 20-50 years | - | Straight-line |
| Machinery and Equipment | 5-15 years | - | Straight-line |
| Furniture and Fixtures | 3-10 years | - | Straight-line |
| Computer Equipment | 3-5 years | - | Straight-line |
| Transportation Equipment | 5-8 years | - | Straight-line |

**Movement Schedule**

| | Land | Building | Machinery | Equipment | Furniture | Computer | Transportation | Construction in Progress | Total |
|---|---|---|---|---|---|---|---|---|---|
| **Cost** | | | | | | | | | |
| Balance, Jan 1, ${priorYear} | - | - | - | - | - | - | - | - | - |
| Additions | - | - | - | - | - | - | - | - | - |
| Disposals | - | - | - | - | - | - | - | - | - |
| Transfers | - | - | - | - | - | - | - | - | - |
| Balance, Dec 31, ${priorYear} | - | - | - | - | - | - | - | - | - |
| Additions | - | - | - | - | - | - | - | - | - |
| Disposals | - | - | - | - | - | - | - | - | - |
| Transfers | - | - | - | - | - | - | - | - | - |
| Balance, Dec 31, ${currentYear} | - | - | - | - | - | - | - | - | - |

**Accumulated Depreciation** | | | | | | | | | |
| Balance, Jan 1, ${priorYear} | - | - | - | - | - | - | - | - | - |
| Depreciation | - | - | - | - | - | - | - | - | - |
| Disposals | - | - | - | - | - | - | - | - | - |
| Balance, Dec 31, ${priorYear} | - | - | - | - | - | - | - | - | - |
| Depreciation | - | - | - | - | - | - | - | - | - |
| Disposals | - | - | - | - | - | - | - | - | - |
| Balance, Dec 31, ${currentYear} | - | - | - | - | - | - | - | - | - |

**Net Book Value** | | | | | | | | | |
| Dec 31, ${currentYear} | - | - | - | - | - | - | - | - | - |
| Dec 31, ${priorYear} | - | - | - | - | - | - | - | - | - |

Depreciation expense recognized in profit or loss is allocated as follows:
| | ${currentYear} | ${priorYear} |
|---|---|---|
| Cost of sales | - | - |
| Administrative expenses | - | - |
| Selling expenses | - | - |
| **Total** | **-** | **-** |

There were no items of property and equipment pledged as security for liabilities as at December 31, ${currentYear} and ${priorYear}.`;
}

function generateRevenueRecognition(entityName, context) {
  return `NOTE X - REVENUE RECOGNITION

Revenue is measured at the fair value of the consideration received or receivable, net of discounts, returns, and value-added tax. The Company recognizes revenue when it is probable that economic benefits will flow to the entity and the amount can be reliably measured.

**Sale of Goods**

Revenue from sale of goods is recognized at the point in time when control of the goods is transferred to the customer, which is generally upon delivery and acceptance by the customer. Payment terms typically range from 30 to 90 days from delivery.

**Rendering of Services**

Revenue from services is recognized over time as services are performed, using the output method based on services completed to date relative to total services to be performed under the contract. For contracts with milestone billings, revenue is recognized based on the achievement of the specified milestones.

**Interest Income**

Interest income is recognized on a time-proportion basis using the effective interest method. The effective interest rate is the rate that exactly discounts the estimated future cash receipts through the expected life of the financial asset to the gross carrying amount of the financial asset.

**Dividend Income**

Dividend income is recognized when the shareholder's right to receive payment is established, which is when the dividend is declared by the investee's board of directors.`;
}

function generateRelatedPartyDisclosures(entityName, context) {
  const currentYear = new Date().getFullYear();
  
  return `NOTE X - RELATED PARTY DISCLOSURES

Parties are considered related if one party has the ability to control the other party or exercise significant influence over the other party in making financial and operating decisions. Related parties include key management personnel, directors, their close family members, and entities under common control.

**Key Management Personnel Compensation**

The compensation of key management personnel during the year is as follows:

| Category | ${currentYear} | ${currentYear - 1} |
|----------|------|------|
| Short-term employee benefits | P - | P - |
| Post-employment benefits | - | - |
| Termination benefits | - | - |
| Share-based payment | - | - |
| **Total** | **P -** | **P -** |

**Transactions with Related Parties**

| Related Party | Relationship | Nature of Transaction | ${currentYear} | ${currentYear - 1} | Outstanding Balance |
|---------------|--------------|----------------------|------|------|---------------------|
| - | - | - | - | - | - |

**Terms and Conditions**

All related party transactions were conducted at arm's length and on normal commercial terms, except as otherwise indicated. Outstanding balances are unsecured and will be settled in accordance with the agreed terms. No impairment was recognized on related party balances during the year.

**Approval Process**

Related party transactions were reviewed and approved by the Audit Committee and Board of Directors in accordance with the Company's Related Party Transaction Policy, which complies with SEC Memorandum Circular No. 15, Series of 2024.`;
}

function generateIncomeTax(entityName, context) {
  const currentYear = new Date().getFullYear();
  
  return `NOTE X - INCOME TAXES

**Current Tax**

Current tax is computed based on taxable income at the rate of 25% (${currentYear - 1}: 25%) for domestic corporations, unless subject to Minimum Corporate Income Tax (MCIT) at 2% of gross income.

**Deferred Tax**

Deferred tax is recognized using the balance sheet liability method on temporary differences between the carrying amounts of assets and liabilities for financial reporting purposes and their tax bases. Deferred tax assets are recognized only to the extent that it is probable that future taxable profits will be available against which the deductible temporary differences can be utilized.

**Reconciliation of Income Tax Expense**

| | ${currentYear} | ${currentYear - 1} |
|---|---|---|
| Profit before tax | P - | P - |
| Tax at statutory rate (25%) | P - | P - |
| Tax effects of: | | |
| Non-deductible expenses | - | - |
| Non-taxable income | - | - |
| Effect of MCIT | - | - |
| Others | - | - |
| **Income tax expense** | **P -** | **P -** |

**Temporary Differences**

| | ${currentYear} | ${currentYear - 1} |
|---|---|---|
| Deferred tax assets: | | |
| Provisions and accruals | - | - |
| Unused NOLCO | - | - |
| Total deferred tax assets | - | - |
| Deferred tax liabilities: | | |
| Property and equipment | - | - |
| Total deferred tax liabilities | - | - |
| **Net deferred tax asset/(liability)** | **P -** | **P -** |

As at December 31, ${currentYear}, the Company has no material temporary differences requiring recognition of deferred tax assets or liabilities.`;
}

function generateFinancialRisk(entityName, context) {
  return `NOTE X - FINANCIAL RISK MANAGEMENT

The Company's financial instruments consist of cash and cash equivalents, trade and other receivables, trade and other payables, and borrowings. The Company is exposed to various financial risks including credit risk, liquidity risk, and market risk.

**Credit Risk**

Credit risk is the risk that a counterparty will not meet its obligations under a financial instrument, leading to a financial loss. The Company manages credit risk by dealing only with creditworthy counterparties, establishing credit limits, and monitoring receivables aging.

The maximum exposure to credit risk is represented by the carrying amount of financial assets:

| | ${new Date().getFullYear()} | ${new Date().getFullYear() - 1} |
|---|---|---|
| Cash and cash equivalents | P - | P - |
| Trade receivables | - | - |
| Other receivables | - | - |
| **Total** | **P -** | **P -** |

**Liquidity Risk**

Liquidity risk is the risk that the Company will encounter difficulty in meeting obligations associated with financial liabilities. The Company manages liquidity risk by maintaining sufficient cash and committed credit facilities.

The table below details the remaining contractual maturities of financial liabilities:

| | Within 1 year | 1-2 years | 2-5 years | Over 5 years | Total |
|---|---|---|---|---|---|
| Trade payables | - | - | - | - | - |
| Accrued expenses | - | - | - | - | - |
| Loans payable | - | - | - | - | - |
| **Total** | **-** | **-** | **-** | **-** | **-** |

**Market Risk**

Market risk is the risk that changes in market prices, such as interest rates and foreign exchange rates, will affect the Company's income or the value of its financial instruments.

*Interest rate risk* - The Company's exposure to interest rate risk relates primarily to its interest-bearing liabilities. The Company manages this risk by maintaining a mix of fixed and floating rate borrowings.

*Foreign currency risk* - The Company's functional currency is the Philippine Peso. Transactions denominated in foreign currencies are minimal, thus foreign currency risk is not significant.

**Capital Management**

The Company monitors capital using the debt-to-equity ratio:

| | ${new Date().getFullYear()} | ${new Date().getFullYear() - 1} |
|---|---|---|
| Total liabilities | P - | P - |
| Total equity | - | - |
| **Debt-to-equity ratio** | **-** | **-** |

The Company's objectives when managing capital are to safeguard the Company's ability to continue as a going concern and to maintain an optimal capital structure to reduce the cost of capital.`;
}

function generateGoingConcern(entityName, context) {
  return `NOTE X - GOING CONCERN ASSESSMENT

The financial statements have been prepared on a going concern basis, which assumes that the Company will be able to continue its operations for the foreseeable future and will be able to realize its assets and discharge its liabilities in the normal course of business.

Management has assessed the Company's ability to continue as a going concern for a period of at least twelve months from the end of the reporting period. In making this assessment, management has considered:

a) The Company's current financial position and cash flow projections;
b) Available credit facilities and ability to meet financial obligations;
c) Operational performance and profitability trends;
d) Market conditions and industry outlook;
e) Compliance with regulatory requirements and loan covenants.

Based on the assessment, management has concluded that no material uncertainties exist that may cast significant doubt on the Company's ability to continue as a going concern.`;
}

function generateLeases(entityName, context) {
  return `NOTE X - LEASES (PFRS 16)

The Company as a lessee assesses whether a contract is or contains a lease at inception of the contract. The Company recognizes a right-of-use asset and a corresponding lease liability with respect to all lease arrangements in which it is the lessee, except for short-term leases (defined as leases with a lease term of 12 months or less) and leases of low-value assets.

**Right-of-Use Assets**

Right-of-use assets are measured at cost comprising the amount of the initial measurement of the lease liability, any lease payments made at or before the commencement date, and any initial direct costs, less accumulated depreciation and impairment losses.

Right-of-use assets are depreciated on a straight-line basis over the shorter of the lease term and the useful life of the underlying asset.

| | Buildings | Vehicles | Equipment | Total |
|---|---|---|---|---|
| **Cost** | | | | |
| Balance, Jan 1, 2023 | - | - | - | - |
| Additions | - | - | - | - |
| Balance, Dec 31, 2023 | - | - | - | - |
| Additions | - | - | - | - |
| Balance, Dec 31, 2024 | - | - | - | - |

| **Accumulated Depreciation** | | | | |
|---|---|---|---|---|
| Balance, Jan 1, 2023 | - | - | - | - |
| Depreciation | - | - | - | - |
| Balance, Dec 31, 2023 | - | - | - | - |
| Depreciation | - | - | - | - |
| Balance, Dec 31, 2024 | - | - | - | - |

| **Net Book Value** | | | | |
|---|---|---|---|---|
| Dec 31, 2024 | - | - | - | - |
| Dec 31, 2023 | - | - | - | - |

**Lease Liabilities**

Lease liabilities are measured at the present value of the lease payments that are not paid at the commencement date. The lease payments are discounted using the interest rate implicit in the lease, or if that rate cannot be readily determined, the Company's incremental borrowing rate.

| | 2024 | 2023 |
|---|---|---|
| Balance, beginning | - | - |
| Additions | - | - |
| Interest expense | - | - |
| Payments | - | - |
| **Balance, ending** | **-** | **-** |

**Maturity Analysis of Lease Liabilities**

| | 2024 |
|---|---|
| Within 1 year | - |
| 1-2 years | - |
| 2-5 years | - |
| Over 5 years | - |
| **Total undiscounted lease payments** | **-** |
| Less: Future interest | - |
| **Present value of lease liabilities** | **-** |

**Short-term and Low-value Leases**

Expense relating to short-term and low-value leases amounted to P - for the year ended December 31, 2024 (2023: P -).`;
}