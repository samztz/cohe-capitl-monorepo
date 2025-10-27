/**
 * Navigation type definitions
 */

export type RootStackParamList = {
  Connect: undefined;
  Products: undefined;
  PolicyForm: { productId: string };
  ContractSign: { policyId: string };
  Pay: { policyId: string };
  Ticket: { policyId: string };
  PolicyStatus: { policyId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
