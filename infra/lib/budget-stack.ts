import { CfnParameter, Stack, type StackProps } from 'aws-cdk-lib'
import { CfnBudget } from 'aws-cdk-lib/aws-budgets'
import type { Construct } from 'constructs'

/** The most the whole account should cost in a month, in US dollars. */
export const MONTHLY_LIMIT_USD = 5

/**
 * One monthly cost budget for the whole account, with email alerts. Sign-in and
 * the score PDFs are public, so this is the early warning if either is abused.
 * A budget only warns: it does not stop anything.
 */
export class BudgetStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Passed at deploy time so the address is never committed (the repo is public).
    const email = new CfnParameter(this, 'AlertEmail', {
      description: 'Email address that receives the budget alerts',
      allowedPattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
      constraintDescription: 'must be an email address',
    })
    const subscribers = [{ subscriptionType: 'EMAIL', address: email.valueAsString }]
    const alert = (notificationType: 'ACTUAL' | 'FORECASTED', threshold: number) => ({
      notification: { notificationType, comparisonOperator: 'GREATER_THAN', threshold, thresholdType: 'PERCENTAGE' },
      subscribers,
    })

    new CfnBudget(this, 'Monthly', {
      budget: {
        budgetName: 'profile-monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: MONTHLY_LIMIT_USD, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        // Spent 80% of the limit so far this month.
        alert('ACTUAL', 80),
        // On course to go over the limit by the end of the month.
        alert('FORECASTED', 100),
      ],
    })
  }
}
