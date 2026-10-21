import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './theme';

export interface TransactionItem {
  id: string;
  title: string;
  date: string;
  amount: string;
  type: 'debit' | 'credit';
  highlight?: boolean;
  icon: string;
}

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'tx-1',
    title: 'Payment to Ramesh Kumar',
    date: '12 Apr 2025',
    amount: '- ₹1,800',
    type: 'debit',
    highlight: false,
    icon: '👤',
  },
  {
    id: 'tx-2',
    title: 'Add Money',
    date: '10 Apr 2025',
    amount: '+ ₹5,000',
    type: 'credit',
    highlight: true,
    icon: '₹',
  },
  {
    id: 'tx-3',
    title: 'Payment to Shahid Ansari',
    date: '5 Apr 2025',
    amount: '- ₹2,200',
    type: 'debit',
    highlight: false,
    icon: '👤',
  },
  {
    id: 'tx-4',
    title: 'Refund',
    date: '2 Apr 2025',
    amount: '+ ₹800',
    type: 'credit',
    highlight: true,
    icon: '↩️',
  },
];

export interface LabourlyWalletScreenProps {
  initialBalance?: number;
  transactions?: TransactionItem[];
  onBack?: () => void;
  onAddMoney?: () => void;
  onSend?: () => void;
  onRequest?: () => void;
  onTransactions?: () => void;
  onInvoice?: () => void;
  onSeeAll?: () => void;
  onTransactionPress?: (tx: TransactionItem) => void;
}

export function LabourlyWalletScreen({
  initialBalance = 12450,
  transactions = DEFAULT_TRANSACTIONS,
  onBack,
  onAddMoney,
  onSend,
  onRequest,
  onTransactions,
  onInvoice,
  onSeeAll,
  onTransactionPress,
}: LabourlyWalletScreenProps) {
  const [balance, setBalance] = useState(initialBalance);

  const handleAddMoney = () => {
    setBalance((prev) => prev + 2000);
    onAddMoney?.();
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Navigation Header */}
      <View style={styles.navBar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Wallet</Text>
        <View style={styles.navSpacer} />
      </View>

      {/* Main Content Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card in Solid Charcoal Black (#202326) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹ {balance.toLocaleString('en-IN')}
            </Text>
          </View>
          <Pressable
            onPress={handleAddMoney}
            accessibilityRole="button"
            accessibilityLabel="Add Money"
            style={({ pressed }) => [
              styles.addMoneyBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.addMoneyText}>Add Money +</Text>
          </Pressable>
        </View>

        {/* Quick Actions (4 Circular #E5E7EB Buttons) */}
        <View style={styles.quickActionsGrid}>
          {/* Send */}
          <Pressable
            onPress={onSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.actionCircle}>
              <Text style={styles.actionIcon}>↗️</Text>
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </Pressable>

          {/* Request */}
          <Pressable
            onPress={onRequest}
            accessibilityRole="button"
            accessibilityLabel="Request"
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.actionCircle}>
              <Text style={styles.actionIcon}>↙️</Text>
            </View>
            <Text style={styles.actionLabel}>Request</Text>
          </Pressable>

          {/* Transactions */}
          <Pressable
            onPress={onTransactions}
            accessibilityRole="button"
            accessibilityLabel="Transactions"
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.actionCircle}>
              <Text style={styles.actionIcon}>⇄</Text>
            </View>
            <Text style={styles.actionLabel}>Transactions</Text>
          </Pressable>

          {/* Invoice */}
          <Pressable
            onPress={onInvoice}
            accessibilityRole="button"
            accessibilityLabel="Invoice"
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.actionCircle}>
              <Text style={styles.actionIcon}>📄</Text>
            </View>
            <Text style={styles.actionLabel}>Invoice</Text>
          </Pressable>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable
              onPress={onSeeAll}
              accessibilityRole="button"
              accessibilityLabel="See all transactions"
              style={({ pressed }) => [pressed && styles.btnPressed]}
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </Pressable>
          </View>

          {/* Stacked Transaction Rows */}
          <View style={styles.transactionsList}>
            {transactions.map((tx) => (
              <Pressable
                key={tx.id}
                onPress={() => onTransactionPress?.(tx)}
                accessibilityRole="button"
                accessibilityLabel={`${tx.title}, ${tx.date}, ${tx.amount}`}
                style={({ pressed }) => [
                  styles.transactionRow,
                  pressed && styles.btnPressed,
                ]}
              >
                {/* Left Side: Circular Badge + Text */}
                <View style={styles.txLeft}>
                  <View style={styles.txBadge}>
                    <Text style={styles.txBadgeIcon}>{tx.icon}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                </View>

                {/* Right Side: Amount */}
                <View style={styles.txRight}>
                  {tx.highlight ? (
                    <View style={styles.highlightPill}>
                      <Text style={styles.highlightAmountText}>
                        {tx.amount}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.normalAmountText}>{tx.amount}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: palette.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  backChevron: {
    fontSize: 28,
    color: palette.ink,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.3,
  },
  navSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 26,
  },
  balanceCard: {
    backgroundColor: palette.ink,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceInfo: {
    gap: 4,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: -0.5,
  },
  addMoneyBtn: {
    backgroundColor: palette.yellow,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: palette.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addMoneyText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: palette.ink,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.grey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: palette.ink,
  },
  transactionsSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.2,
  },
  seeAllLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: palette.ink,
  },
  transactionsList: {
    backgroundColor: palette.white,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.7)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.grey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBadgeIcon: {
    fontSize: 18,
  },
  txInfo: {
    gap: 2,
  },
  txTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: palette.ink,
  },
  txDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  normalAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.ink,
  },
  highlightPill: {
    backgroundColor: palette.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highlightAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: palette.ink,
  },
  btnPressed: {
    opacity: 0.7,
  },
});
