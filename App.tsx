import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { theme } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import { requestNotificationPermissions } from './src/notifications';

export type RootStackParamList = {
  MainTabs: undefined;
  AddTask: { taskId?: string } | undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dynamic Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Splash screen with entrance + exit animations ───────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  // Entrance
  const logoScale   = useSharedValue(0.72);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(14);
  const tagOpacity  = useSharedValue(0);
  const tagY        = useSharedValue(10);

  // Exit overlay
  const overlayOpacity = useSharedValue(1);
  const overlayScale   = useSharedValue(1);

  const ease = Easing.out(Easing.quad);

  useEffect(() => {
    // — Entrance animations —
    logoOpacity.value = withTiming(1, { duration: 420, easing: ease });
    logoScale.value   = withSpring(1, { damping: 14, stiffness: 110 });

    textOpacity.value = withDelay(220, withTiming(1, { duration: 380, easing: ease }));
    textY.value       = withDelay(220, withTiming(0, { duration: 380, easing: ease }));

    tagOpacity.value  = withDelay(380, withTiming(1, { duration: 340, easing: ease }));
    tagY.value        = withDelay(380, withTiming(0, { duration: 340, easing: ease }));

    // — Trigger exit after hold time —
    const exitDelay = 2400;
    const exitDuration = 620;

    const timer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, {
        duration: exitDuration,
        easing: Easing.in(Easing.quad),
      }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
      overlayScale.value = withTiming(1.07, {
        duration: exitDuration,
        easing: Easing.out(Easing.quad),
      });
    }, exitDelay);

    return () => clearTimeout(timer);
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity:   overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity:   tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.splash, overlayStyle]}>
      <Animated.View style={[styles.logoMark, logoStyle]}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={52}
          color={theme.colors.primary}
        />
      </Animated.View>

      <Animated.Text style={[styles.appName, textStyle]}>
        Dynamic Tasks
      </Animated.Text>

      <Animated.Text style={[styles.tagline, tagStyle]}>
        Stay on top of everything
      </Animated.Text>

      <Text style={styles.footer}>Powered by Dynamic.IO</Text>
    </Animated.View>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Fade-in for the app content
  const appOpacity = useSharedValue(0);

  const appStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: appOpacity.value,
  }));

  const handleSplashDone = () => {
    setSplashVisible(false);
  };

  // Start fading in the app content slightly before the splash finishes exiting
  useEffect(() => {
    const timer = setTimeout(() => {
      appOpacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      });
    }, 2200); // starts 200ms before splash exit begins
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* App renders immediately underneath — NavigationContainer warms up in the bg */}
        <Animated.View style={appStyle}>
          <NavigationContainer theme={theme}>
            <Stack.Navigator
              screenOptions={{
                headerStyle:       { backgroundColor: theme.colors.surface },
                headerShadowVisible: false,
                headerTintColor:   theme.colors.text,
                headerTitleStyle:  { fontWeight: '700', fontSize: 17 },
              }}
            >
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AddTask"
                component={AddTaskScreen}
                options={{ title: 'Add Task', presentation: 'modal' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </Animated.View>

        {/* Splash overlay sits on top and animates out */}
        {splashVisible && <SplashScreen onDone={handleSplashDone} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.textMuted,
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: theme.colors.textMuted,
    opacity: 0.45,
  },
});
