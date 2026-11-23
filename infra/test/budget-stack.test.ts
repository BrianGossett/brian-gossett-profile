import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { BudgetStack } from '../lib/budget-stack'

const template = Template.fromStack(new BudgetStack(new App(), 'TestBudget'))

describe('BudgetStack', () => {
  it('creates one monthly cost budget of $5', () => {
    template.resourceCountIs('AWS::Budgets::Budget', 1)
    template.hasResourceProperties('AWS::Budgets::Budget', {
      Budget: Match.objectLike({ BudgetType: 'COST', TimeUnit: 'MONTHLY', BudgetLimit: { Amount: 5, Unit: 'USD' } }),
    })
  })

  it('alerts at 80% of actual spend and 100% of forecast spend', () => {
    const [budget] = Object.values(template.findResources('AWS::Budgets::Budget'))
    const alerts = budget.Properties.NotificationsWithSubscribers.map((n: { Notification: { NotificationType: string; Threshold: number } }) =>
      [n.Notification.NotificationType, n.Notification.Threshold])
    expect(alerts).toEqual([['ACTUAL', 80], ['FORECASTED', 100]])
  })

  it('takes the email address as a deploy-time parameter, never hard-coded', () => {
    template.hasParameter('AlertEmail', {})
    expect(JSON.stringify(template.toJSON())).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/)
  })
})
