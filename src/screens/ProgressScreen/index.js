import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  useWindowDimensions,
  Share,
  Alert,
  Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { G, Path, Polygon, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { StreakManager } from '../../utils/streakManager';
import { getDateKey } from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color palette for charts - 7 distinct colors
const CHART_COLORS = {
  primary: '#8B5CF6',      // Purple
  secondary: '#3B82F6',    // Blue
  tertiary: '#10B981',     // Green
  quaternary: '#F59E0B',   // Amber
  quinary: '#EF4444',       // Red
  senary: '#EC4899',       // Pink
  septenary: '#06B6D4',    // Cyan
  // Combinations for gradients
  purpleBlue: ['#8B5CF6', '#3B82F6'],
  greenAmber: ['#10B981', '#F59E0B'],
  redPink: ['#EF4444', '#EC4899'],
  cyanPurple: ['#06B6D4', '#8B5CF6'],
  // Multi-color gradients
  rainbow: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']
};

const ProgressScreen = ({ onBack }) => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    dailyData: [],
    weeklyData: [],
    monthlyData: [],
    yearlyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      
      // Load share streak data from StreakManager
      const streakInfo = await StreakManager.getStreakData();
      console.log('Current streak info:', streakInfo);
      
      // Generate mock data for demonstration based on current streak
      // In real implementation, this would track actual share events
      const generateShareData = (today) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekData = [];
        
        // Get the start of the current week (Monday)
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        
        // Generate data for each day based on current streak
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(monday);
          currentDate.setDate(monday.getDate() + i);
          const dateKey = currentDate.toISOString().split('T')[0];
          const dayName = days[i];
          
          // Simulate share data - in real app, track actual share events
          const isToday = currentDate.toDateString() === today.toDateString();
          const baseShares = Math.max(0, streakInfo.streakDays - (6 - i));
          const randomShares = isToday ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
          
          const dailyShares = baseShares > 0 ? baseShares + randomShares : 0;
          const moodShares = Math.floor(dailyShares * 0.3); // 30% of daily
          const discoverShares = Math.floor(dailyShares * 0.2); // 20% of daily
          
          const dayData = {
            day: dayName,
            daily: dailyShares,
            mood: moodShares,
            discover: discoverShares,
            total: dailyShares + moodShares + discoverShares,
            date: dateKey
          };
          
          console.log(`Share Day ${dayName} (${dateKey}):`, dayData);
          weekData.push(dayData);
        }
        
        return weekData;
      };
      
      // Generate share-based data for all periods
      const dailyData = generateShareData(today);
      
      // Generate weekly data (mock for now)
      const weeklyData = [];
      for (let i = 7; i >= 0; i--) {
        const weekKey = `Week ${8 - i}`;
        const baseWeeklyShares = Math.max(1, streakInfo.streakDays - i);
        weeklyData.push({
          week: weekKey,
          daily: baseWeeklyShares,
          mood: Math.floor(baseWeeklyShares * 0.3),
          discover: Math.floor(baseWeeklyShares * 0.2),
          total: baseWeeklyShares + Math.floor(baseWeeklyShares * 0.3) + Math.floor(baseWeeklyShares * 0.2)
        });
      }
      
      // Generate monthly data (mock for now)
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const monthKey = months[(today.getMonth() - i + 12) % 12];
        const baseMonthlyShares = Math.max(1, streakInfo.streakDays - i * 4);
        monthlyData.push({
          month: monthKey,
          daily: baseMonthlyShares,
          mood: Math.floor(baseMonthlyShares * 0.3),
          discover: Math.floor(baseMonthlyShares * 0.2),
          total: baseMonthlyShares + Math.floor(baseMonthlyShares * 0.3) + Math.floor(baseMonthlyShares * 0.2)
        });
      }
      
      // Generate yearly data (mock for now)
      const yearlyData = [];
      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;
        const yearKey = year.toString();
        const baseYearlyShares = Math.max(1, streakInfo.streakDays - i * 50);
        yearlyData.push({
          year: yearKey,
          daily: baseYearlyShares,
          mood: Math.floor(baseYearlyShares * 0.3),
          discover: Math.floor(baseYearlyShares * 0.2),
          total: baseYearlyShares + Math.floor(baseYearlyShares * 0.3) + Math.floor(baseYearlyShares * 0.2)
        });
      }
      
      console.log('Generated daily data length:', dailyData.length);
      console.log('Generated weekly data length:', weeklyData.length);
      console.log('Generated monthly data length:', monthlyData.length);
      console.log('Generated yearly data length:', yearlyData.length);
      
      setStreakData({
        currentStreak: streakInfo.streakDays,
        longestStreak: streakInfo.streakDays, // For now, same as current
        totalDays: dailyData.reduce((sum, day) => sum + day.total, 0),
        dailyData,
        weeklyData,
        monthlyData,
        yearlyData
      });
      
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

 

  const processDailyStreakData = (submissions) => {
    console.log('Processing daily data with submissions:', submissions.length);
    console.log('Sample submission:', submissions[0]);
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekData = [];
    
    // Get the start of the current week (Monday)
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Sunday = 0, so go back 6 days
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    console.log('Monday of week:', monday.toISOString().split('T')[0]);
    
    // Generate data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayName = days[i];
      
      const dailyQuestions = submissions.filter(sub => {
        const submissionDate = sub.timestamp ? sub.timestamp.split('T')[0] : null;
        return submissionDate === dateKey && sub.type === 'daily';
      }).length;
      const moodQuestions = submissions.filter(sub => {
        const submissionDate = sub.timestamp ? sub.timestamp.split('T')[0] : null;
        return submissionDate === dateKey && sub.type === 'mood';
      }).length;
      const discoverQuestions = submissions.filter(sub => {
        const submissionDate = sub.timestamp ? sub.timestamp.split('T')[0] : null;
        return submissionDate === dateKey && sub.type === 'discover';
      }).length;
      
      const dayData = {
        day: dayName,
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: dailyQuestions + moodQuestions + discoverQuestions,
        date: dateKey
      };
      
      console.log(`Day ${dayName} (${dateKey}):`, dayData);
      weekData.push(dayData);
    }
    
    console.log('Final week data:', weekData);
    return weekData;
  };

  const processWeeklyStreakData = (submissions) => {
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekKey = `Week ${8 - i}`;
      const dailyQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const submissionDate = new Date(sub.timestamp);
        return submissionDate >= weekStart && submissionDate <= weekEnd && sub.type === 'daily';
      }).length;
      const moodQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const submissionDate = new Date(sub.timestamp);
        return submissionDate >= weekStart && submissionDate <= weekEnd && sub.type === 'mood';
      }).length;
      const discoverQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const submissionDate = new Date(sub.timestamp);
        return submissionDate >= weekStart && submissionDate <= weekEnd && sub.type === 'discover';
      }).length;
      
      weeklyData.push({
        week: weekKey,
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: dailyQuestions + moodQuestions + discoverQuestions
      });
    }
    
    return weeklyData;
  };

  const processMonthlyStreakData = (submissions) => {
    const monthlyData = [];
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthKey = months[monthStart.getMonth()];
      const dailyQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const submissionDate = new Date(sub.timestamp);
        return submissionDate >= monthStart && submissionDate <= monthEnd && sub.type === 'daily';
      }).length;
      const moodQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const submissionDate = new Date(sub.timestamp);
        return submissionDate >= monthStart && submissionDate <= monthEnd && sub.type === 'mood';
      }).length;
      const discoverQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const submissionDate = new Date(sub.timestamp);
        return submissionDate >= monthStart && submissionDate <= monthEnd && sub.type === 'discover';
      }).length;
      
      monthlyData.push({
        month: monthKey,
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: dailyQuestions + moodQuestions + discoverQuestions
      });
    }
    
    return monthlyData;
  };

  const processYearlyStreakData = (submissions) => {
    const yearlyData = [];
    const today = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const year = today.getFullYear() - i;
      const yearKey = year.toString();
      
      const dailyQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        return sub.timestamp.startsWith(yearKey) && sub.type === 'daily';
      }).length;
      const moodQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        return sub.timestamp.startsWith(yearKey) && sub.type === 'mood';
      }).length;
      const discoverQuestions = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        return sub.timestamp.startsWith(yearKey) && sub.type === 'discover';
      }).length;
      
      yearlyData.push({
        year: yearKey,
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: dailyQuestions + moodQuestions + discoverQuestions
      });
    }
    
    return yearlyData;
  };

  const calculateLongestStreak = (submissions) => {
    if (submissions.length === 0) return 0;
    
    // Get unique dates from submissions
    const uniqueDates = [...new Set(
      submissions
        .filter(sub => sub.timestamp)
        .map(sub => sub.timestamp.split('T')[0])
        .sort()
    )];
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  };

  const renderMultiColorChart = () => {
    const data = selectedPeriod === 'daily' ? streakData.dailyData :
                 selectedPeriod === 'weekly' ? streakData.weeklyData :
                 selectedPeriod === 'monthly' ? streakData.monthlyData :
                 streakData.yearlyData;

    console.log('renderMultiColorChart called with period:', selectedPeriod);
    console.log('Data length:', data ? data.length : 'null');
    console.log('Data sample:', data ? data[0] : 'null');
    console.log('Streak data:', streakData);

    if (!data || data.length === 0) {
      console.log('No data available for chart');
      return (
        <View style={[styles.chartContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
          <Text style={{ color: isDark ? '#A0A0A0' : theme.colors.textMuted, textAlign: 'center', padding: 20 }}>
            No data available for {selectedPeriod} view
          </Text>
        </View>
      );
    }

    const maxValue = Math.max(...data.map(d => d.total), 1);
    console.log('Max value for chart:', maxValue);
    
    const dynamicStyles = {
      chartTitle: {
        fontSize: windowWidth > 380 ? 20 : 18,
        fontWeight: '600',
        color: isDark ? '#FFFFFF' : theme.colors.text
      },
      chartSubtitle: {
        fontSize: windowWidth > 380 ? 16 : 14,
        marginTop: 4,
        color: isDark ? '#A0A0A0' : theme.colors.textMuted
      },
      legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        flexWrap: 'wrap'
      },
      legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: windowWidth > 380 ? 8 : 4,
        marginVertical: 2
      },
      legendColor: {
        width: windowWidth > 380 ? 12 : 10,
        height: windowWidth > 380 ? 12 : 10,
        borderRadius: 2,
        marginRight: 6
      },
      legendText: {
        fontSize: windowWidth > 380 ? 12 : 10,
        fontWeight: '500',
        color: isDark ? '#A0A0A0' : theme.colors.textMuted
      }
    };

    return (
      <View style={[styles.chartContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.chartHeader}>
          <Text style={dynamicStyles.chartTitle}>
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Progress
          </Text>
          <Text style={dynamicStyles.chartSubtitle}>
            Share activity over time
          </Text>
        </View>
        <View style={dynamicStyles.legendContainer}>
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.primary }]} />
            <Text style={dynamicStyles.legendText}>Daily</Text>
          </View>
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.secondary }]} />
            <Text style={dynamicStyles.legendText}>Mood</Text>
          </View>
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.tertiary }]} />
            <Text style={dynamicStyles.legendText}>Discover</Text>
          </View>
        </View>
        
        {/* Render different chart types based on period */}
        {selectedPeriod === 'daily' && renderLineChart(data, maxValue)}
        {selectedPeriod === 'weekly' && renderWeeklySemiCircleChartFallback(data)}
        {selectedPeriod === 'monthly' && renderMonthlyPieChartFallback(data)}
        {selectedPeriod === 'yearly' && renderPieChart(data, maxValue)}
      </View>
    );
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describePieSlice = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  };

  const renderMonthlyPieChart = (data) => {
    const radius = windowWidth > 380 ? 70 : 60;
    const size = radius * 2;
    const cx = radius;
    const cy = radius;

    const currentMonth = data && data.length ? data[data.length - 1] : null;

    return (
      <View style={styles.pieChartContainer}>
        {!currentMonth ? (
          <View style={styles.pieChartWrapper}>
            <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>No data</Text>
          </View>
        ) : (() => {
          const segments = [
            { key: 'Daily', value: currentMonth.daily || 0, color: CHART_COLORS.primary },
            { key: 'Mood', value: currentMonth.mood || 0, color: CHART_COLORS.secondary },
            { key: 'Discover', value: currentMonth.discover || 0, color: CHART_COLORS.tertiary }
          ];

          const total = segments.reduce((sum, s) => sum + s.value, 0);
          let startAngle = 0;

          return (
            <View style={styles.pieChartItem}>
              <View style={styles.pieChartLabel}>
                <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 11 : 10 }]}>
                  {currentMonth.month}
                </Text>
              </View>

              <View style={styles.pieChartVisual}>
                <Svg width={size} height={size}>
                  <G>
                    {total > 0 ? (
                      segments
                        .filter(s => s.value > 0)
                        .map((seg) => {
                          const angle = (seg.value / total) * 360;
                          const endAngle = startAngle + angle;
                          const d = describePieSlice(cx, cy, radius, startAngle, endAngle);
                          startAngle = endAngle;
                          return (
                            <Path
                              key={seg.key}
                              d={d}
                              fill={seg.color}
                              opacity={0.95}
                            />
                          );
                        })
                    ) : (
                      <Path
                        d={describePieSlice(cx, cy, radius, 0, 359.99)}
                        fill={theme.colors.border}
                        opacity={0.35}
                      />
                    )}
                  </G>
                </Svg>
              </View>

              <View style={styles.monthlyPieLegend}>
                {segments.map((seg) => {
                  const pct = total > 0 ? (seg.value / total) * 100 : 0;
                  return (
                    <View key={seg.key} style={styles.monthlyPieLegendRow}>
                      <View style={[styles.monthlyPieLegendSwatch, { backgroundColor: seg.color }]} />
                      <Text style={[styles.monthlyPieLegendText, { color: theme.colors.textMuted }]}>
                        {seg.key} {pct.toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}
      </View>
    );
  };

  const describeHexagon = (centerX, centerY, radius) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
};

const renderWeeklyHexagonChart = (data) => {
  const maxRadius = windowWidth > 380 ? 40 : 30;
  const size = maxRadius * 2 + 40;
  
  return (
    <View style={styles.hexagonChartContainer}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartScroll}
        contentContainerStyle={styles.chartScrollContent}
      >
        <View style={styles.hexagonChartArea}>
          {data.map((item, index) => {
            const maxValue = Math.max(...data.map(d => d.total), 1);
            const radius = (item.total / maxValue) * maxRadius;
            const cx = maxRadius + 20;
            const cy = maxRadius + 20;
            
            return (
              <View key={index} style={styles.hexagonChartItem}>
                <View style={styles.hexagonChartLabel}>
                  <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                    {item.week}
                  </Text>
                </View>
                
                <View style={styles.hexagonChartVisual}>
                  <Svg width={size} height={size}>
                    {/* Background hexagon */}
                    <Polygon
                      points={describeHexagon(cx, cy, maxRadius)}
                      fill={theme.colors.border}
                      opacity={0.2}
                    />
                    
                    {/* Data hexagon */}
                    <Polygon
                      points={describeHexagon(cx, cy, radius)}
                      fill={CHART_COLORS.primary}
                      opacity={0.8}
                    />
                    
                    {/* Inner hexagon for visual depth */}
                    {radius > 10 && (
                      <Polygon
                        points={describeHexagon(cx, cy, radius * 0.7)}
                        fill={CHART_COLORS.primary}
                        opacity={0.4}
                      />
                    )}
                    
                    {/* Center dot */}
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={CHART_COLORS.primary}
                      opacity={0.9}
                    />
                  </Svg>
                  
                  <Text style={[styles.hexagonChartValue, { color: theme.colors.text }]}>
                    {item.total}
                  </Text>
                </View>
                
                {/* Legend for this week */}
                <View style={styles.hexagonLegend}>
                  <View style={styles.hexagonLegendRow}>
                    <View style={[styles.hexagonLegendDot, { backgroundColor: CHART_COLORS.primary }]} />
                    <Text style={[styles.hexagonLegendText, { color: theme.colors.textMuted }]}>
                      Daily: {item.daily}
                    </Text>
                  </View>
                  <View style={styles.hexagonLegendRow}>
                    <View style={[styles.hexagonLegendDot, { backgroundColor: CHART_COLORS.secondary }]} />
                    <Text style={[styles.hexagonLegendText, { color: theme.colors.textMuted }]}>
                      Mood: {item.mood}
                    </Text>
                  </View>
                  <View style={styles.hexagonLegendRow}>
                    <View style={[styles.hexagonLegendDot, { backgroundColor: CHART_COLORS.tertiary }]} />
                    <Text style={[styles.hexagonLegendText, { color: theme.colors.textMuted }]}>
                      Discover: {item.discover}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const renderWeeklySemiCircleChartFallback = (data) => {
  // Calculate total progress across all weeks
  const totalDaily = data.reduce((sum, item) => sum + (item.daily || 0), 0);
  const totalMood = data.reduce((sum, item) => sum + (item.mood || 0), 0);
  const totalDiscover = data.reduce((sum, item) => sum + (item.discover || 0), 0);
  const totalAll = totalDaily + totalMood + totalDiscover;
  
  const segments = [
    { key: 'Daily', value: totalDaily, color: CHART_COLORS.primary },
    { key: 'Mood', value: totalMood, color: CHART_COLORS.secondary },
    { key: 'Discover', value: totalDiscover, color: CHART_COLORS.tertiary }
  ];
  
  const circleSize = windowWidth > 380 ? 160 : 140;
  const radius = circleSize / 2;
  
  return (
    <View style={styles.semiCircleChartContainer}>
      <View style={styles.semiCircleChartVisual}>
        {/* Single full circle showing all progress with colored segments */}
        <View style={styles.semiCircleContainer}>
          {/* Full circle container (no overflow hidden) */}
          <View style={[
            styles.semiCircleCircularContainer,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: radius,
              // Remove overflow: hidden to show full circle
            }
          ]}>
            {/* Background full circle */}
            <View style={[
              styles.semiCircleFullBackground,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: radius,
                backgroundColor: theme.colors.border,
                opacity: 0.2,
                position: 'absolute',
                top: 0,
                left: 0
              }
            ]} />
            
            {/* Colored segments as pie slices for full circle */}
            {totalAll > 0 ? (
              <View style={styles.semiCirclePieContainer}>
                {segments.map((seg, segIndex) => {
                  const percentage = totalAll > 0 ? (seg.value / totalAll) : 0;
                  const angle = percentage * 360;
                  const startAngle = segIndex === 0 ? 0 : 
                    segments.slice(0, segIndex).reduce((acc, s) => acc + (totalAll > 0 ? (s.value / totalAll) : 0), 0) * 360;
                  const endAngle = startAngle + angle;
                  
                  // Calculate pie slice coordinates for full circle
                  const startAngleRad = (startAngle - 90) * Math.PI / 180;
                  const endAngleRad = (endAngle - 90) * Math.PI / 180;
                  
                  const x1 = radius + radius * Math.cos(startAngleRad);
                  const y1 = radius + radius * Math.sin(startAngleRad);
                  const x2 = radius + radius * Math.cos(endAngleRad);
                  const y2 = radius + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  // Create pie slice using border technique
                  return (
                    <View key={seg.key} style={[
                      styles.semiCircleWedge,
                      {
                        position: 'absolute',
                        left: radius,
                        top: radius,
                        width: 0,
                        height: 0,
                        backgroundColor: 'transparent',
                        borderLeftWidth: radius,
                        borderLeftColor: seg.color,
                        borderTopWidth: radius,
                        borderTopColor: 'transparent',
                        borderRightWidth: radius,
                        borderRightColor: 'transparent',
                        borderBottomWidth: radius,
                        borderBottomColor: 'transparent',
                        transform: [
                          { rotate: `${startAngle}deg` },
                          { translateX: -radius },
                          { translateY: -radius }
                        ],
                        opacity: 0.9,
                        transformOrigin: 'center'
                      }
                    ]} />
                  );
                })}
              </View>
            ) : (
              <View style={[
                styles.semiCircleEmpty,
                {
                  width: circleSize,
                  height: circleSize,
                  borderRadius: radius,
                  backgroundColor: theme.colors.border,
                  opacity: 0.3,
                  position: 'absolute',
                  top: 0,
                  left: 0
                }
              ]} />
            )}
          </View>
        </View>
        
        <Text style={[styles.semiCircleChartValue, { color: theme.colors.text, fontSize: 16, fontWeight: '700' }]}>
          Total Progress: {totalAll}
        </Text>
        
        {/* Legend */}
        <View style={styles.semiCircleLegend}>
          {segments.map((seg) => {
            const percentage = totalAll > 0 ? (seg.value / totalAll) * 100 : 0;
            return (
              <View key={seg.key} style={styles.semiCircleLegendRow}>
                <View style={[styles.semiCircleLegendDot, { backgroundColor: seg.color }]} />
                <Text style={[styles.semiCircleLegendText, { color: theme.colors.textMuted }]}>
                  {seg.key}: {seg.value} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const renderWeeklyChartFallback = (data) => {
  const maxValue = Math.max(...data.map(d => d.total), 1);
  
  return (
    <View style={styles.weeklyChartContainer}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartScroll}
        contentContainerStyle={styles.chartScrollContent}
      >
        <View style={styles.weeklyChartArea}>
          {data.map((item, index) => {
            const dailyHeight = (item.daily / maxValue) * 120;
            const moodHeight = (item.mood / maxValue) * 120;
            const discoverHeight = (item.discover / maxValue) * 120;
            
            return (
              <View key={index} style={styles.weeklyChartItem}>
                <View style={styles.weeklyChartLabel}>
                  <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                    {item.week}
                  </Text>
                </View>
                
                <View style={styles.weeklyChartVisual}>
                  {/* Stacked bars like the image */}
                  <View style={styles.weeklyBarsContainer}>
                    {/* Daily bar - Purple */}
                    <View style={[
                      styles.weeklyBar,
                      {
                        height: dailyHeight,
                        backgroundColor: CHART_COLORS.primary,
                        opacity: 0.9,
                        marginBottom: 2
                      }
                    ]} />
                    
                    {/* Mood bar - Blue */}
                    <View style={[
                      styles.weeklyBar,
                      {
                        height: moodHeight,
                        backgroundColor: CHART_COLORS.secondary,
                        opacity: 0.9,
                        marginBottom: 2
                      }
                    ]} />
                    
                    {/* Discover bar - Green */}
                    <View style={[
                      styles.weeklyBar,
                      {
                        height: discoverHeight,
                        backgroundColor: CHART_COLORS.tertiary,
                        opacity: 0.9
                      }
                    ]} />
                  </View>
                  
                  <Text style={[styles.weeklyChartValue, { color: theme.colors.text }]}>
                    {item.total}
                  </Text>
                </View>
                
                {/* Legend */}
                <View style={styles.weeklyLegend}>
                  <View style={styles.weeklyLegendRow}>
                    <View style={[styles.weeklyLegendDot, { backgroundColor: CHART_COLORS.primary }]} />
                    <Text style={[styles.weeklyLegendText, { color: theme.colors.textMuted }]}>
                      {item.daily}
                    </Text>
                  </View>
                  <View style={styles.weeklyLegendRow}>
                    <View style={[styles.weeklyLegendDot, { backgroundColor: CHART_COLORS.secondary }]} />
                    <Text style={[styles.weeklyLegendText, { color: theme.colors.textMuted }]}>
                      {item.mood}
                    </Text>
                  </View>
                  <View style={styles.weeklyLegendRow}>
                    <View style={[styles.weeklyLegendDot, { backgroundColor: CHART_COLORS.tertiary }]} />
                    <Text style={[styles.weeklyLegendText, { color: theme.colors.textMuted }]}>
                      {item.discover}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const renderMonthlyPieChartFallback = (data) => {
  const radius = windowWidth > 380 ? 70 : 60;
  const size = radius * 2;
  const currentMonth = data && data.length ? data[data.length - 1] : null;

  if (!currentMonth) {
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChartWrapper}>
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>No data</Text>
        </View>
      </View>
    );
  }

  const segments = [
      { key: 'Daily', value: currentMonth.daily || 0, color: CHART_COLORS.primary },
      { key: 'Mood', value: currentMonth.mood || 0, color: CHART_COLORS.secondary },
      { key: 'Discover', value: currentMonth.discover || 0, color: CHART_COLORS.tertiary }
    ];

    const total = segments.reduce((sum, s) => sum + s.value, 0);

    // Simple fallback: show colored bars representing percentages
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChartItem}>
          <View style={styles.pieChartLabel}>
            <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 11 : 10 }]}>
              {currentMonth.month}
            </Text>
          </View>

          <View style={styles.pieChartVisual}>
            <View style={styles.fallbackPieContainer}>
              {segments.map((seg) => {
                const pct = total > 0 ? (seg.value / total) * 100 : 0;
                const height = total > 0 ? (pct / 100) * 120 : 0;
                return (
                  <View key={seg.key} style={styles.fallbackPieSlice}>
                    <View
                      style={[
                        styles.fallbackPieBar,
                        {
                          backgroundColor: seg.color,
                          height: height > 0 ? height : 4,
                          opacity: height > 0 ? 0.95 : 0.35
                        }
                      ]}
                    />
                    <Text style={[styles.fallbackPieLabel, { color: theme.colors.textMuted }]}>
                      {seg.key}
                    </Text>
                    <Text style={[styles.fallbackPiePercent, { color: theme.colors.text }]}>
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLineChart = (data, maxValue) => {
    return (
      <View style={styles.lineChartContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chartScroll}
          contentContainerStyle={styles.chartScrollContent}
        >
          <View style={styles.chartArea}>
            {data.map((item, index) => {
              const dailyHeight = (item.daily / maxValue) * 150;
              const moodHeight = (item.mood / maxValue) * 150;
              const discoverHeight = (item.discover / maxValue) * 150;
              const totalHeight = (item.total / maxValue) * 150;
              
              return (
                <View key={index} style={styles.lineChartBar}>
                  <View style={styles.barLabel}>
                    <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                      {item.day}
                    </Text>
                  </View>
                  <View style={styles.lineChartWrapper}>
                    {/* Multiple colored bars stacked vertically */}
                    <View style={styles.dailyBarsContainer}>
                      {/* Daily bar - Purple */}
                      <View style={[
                        styles.dailyBar,
                        {
                          height: dailyHeight,
                          backgroundColor: CHART_COLORS.primary,
                          opacity: 0.9,
                          marginBottom: 2
                        }
                      ]}>
                        <View style={[
                          styles.dailyBarGradient,
                          {
                            backgroundColor: CHART_COLORS.primary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.dailyBarHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                      
                      {/* Mood bar - Blue */}
                      <View style={[
                        styles.dailyBar,
                        {
                          height: moodHeight,
                          backgroundColor: CHART_COLORS.secondary,
                          opacity: 0.9,
                          marginBottom: 2
                        }
                      ]}>
                        <View style={[
                          styles.dailyBarGradient,
                          {
                            backgroundColor: CHART_COLORS.secondary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.dailyBarHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                      
                      {/* Discover bar - Green */}
                      <View style={[
                        styles.dailyBar,
                        {
                          height: discoverHeight,
                          backgroundColor: CHART_COLORS.tertiary,
                          opacity: 0.9
                        }
                      ]}>
                        <View style={[
                          styles.dailyBarGradient,
                          {
                            backgroundColor: CHART_COLORS.tertiary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.dailyBarHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                    </View>
                    
                    {/* Line graph overlay */}
                    <View style={styles.lineGraphOverlay}>
                      {/* Calculate line path connecting all bars */}
                      <View style={styles.lineGraphPath}>
                        {data.map((item, index) => {
                          const totalHeight = (item.total / maxValue) * 150;
                          const barWidth = 60; // Width of each bar column
                          const spacing = 20; // Spacing between bars
                          const x = index * (barWidth + spacing); // X coordinate (horizontal)
                          const y = 150 - totalHeight; // Y coordinate (vertical, inverted for chart)
                          
                          return (
                            <View key={index} style={[
                              styles.lineGraphPoint,
                              {
                                left: `${x + barWidth/2 - 6}px`, // X coordinate (center of bar)
                                bottom: `${y - 6}px` // Y coordinate (top of bar)
                              }
                            ]}>
                              <View style={[
                                styles.lineGraphDot,
                                {
                                  backgroundColor: CHART_COLORS.primary,
                                  borderColor: '#FFFFFF'
                                }
                              ]} />
                            </View>
                          );
                        })}
                        
                        {/* Connect the dots with lines */}
                        {data.map((item, index) => {
                          if (index === 0) return null;
                          
                          const currentHeight = (item.total / maxValue) * 150;
                          const prevHeight = (data[index - 1].total / maxValue) * 150;
                          const barWidth = 60;
                          const spacing = 20;
                          
                          const currentX = index * (barWidth + spacing) + barWidth/2; // X coordinate (center of current bar)
                          const prevX = (index - 1) * (barWidth + spacing) + barWidth/2; // X coordinate (center of previous bar)
                          const lineLength = currentX - prevX; // Line length in pixels
                          
                          const currentY = 150 - currentHeight; // Y coordinate (inverted)
                          const prevY = 150 - prevHeight; // Y coordinate (inverted)
                          const heightDiff = Math.abs(currentY - prevY); // Height difference
                          
                          return (
                            <View key={`line-${index}`} style={[
                              styles.lineGraphLine,
                              {
                                left: `${prevX}px`, // X coordinate (start point)
                                width: `${lineLength}px`, // Width (horizontal distance)
                                bottom: `${Math.min(currentY, prevY)}px`, // Y coordinate (lower of two points)
                                height: `${heightDiff}px`, // Height (vertical distance)
                                backgroundColor: CHART_COLORS.primary,
                                opacity: 0.8
                              }
                            ]} />
                          );
                        })}
                      </View>
                    </View>
                    
                    {item.total > 0 && (
                      <Text style={[styles.barValue, { color: theme.colors.text, fontSize: windowWidth > 380 ? 8 : 7 }]}>
                        {item.total}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAreaChart = (data, maxValue) => {
    return (
      <View style={styles.areaChartContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chartScroll}
          contentContainerStyle={styles.chartScrollContent}
        >
          <View style={styles.chartArea}>
            {data.map((item, index) => {
              const dailyHeight = (item.daily / maxValue) * 150;
              const moodHeight = (item.mood / maxValue) * 150;
              const discoverHeight = (item.discover / maxValue) * 150;
              const totalHeight = (item.total / maxValue) * 150;
              
              return (
                <View key={index} style={styles.areaChartBar}>
                  <View style={styles.barLabel}>
                    <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                      {item.week}
                    </Text>
                  </View>
                  <View style={styles.areaChartWrapper}>
                    {/* Multiple colored bars stacked vertically */}
                    <View style={styles.weeklyBarsContainer}>
                      {/* Daily bar - Purple */}
                      <View style={[
                        styles.dailyBar,
                        {
                          height: dailyHeight,
                          backgroundColor: CHART_COLORS.primary,
                          opacity: 0.9,
                          marginBottom: 2
                        }
                      ]}>
                        <View style={[
                          styles.dailyBarGradient,
                          {
                            backgroundColor: CHART_COLORS.primary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.dailyBarHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                      
                      {/* Mood bar - Blue */}
                      <View style={[
                        styles.dailyBar,
                        {
                          height: moodHeight,
                          backgroundColor: CHART_COLORS.secondary,
                          opacity: 0.9,
                          marginBottom: 2
                        }
                      ]}>
                        <View style={[
                          styles.dailyBarGradient,
                          {
                            backgroundColor: CHART_COLORS.secondary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.dailyBarHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                      
                      {/* Discover bar - Green */}
                      <View style={[
                        styles.dailyBar,
                        {
                          height: discoverHeight,
                          backgroundColor: CHART_COLORS.tertiary,
                          opacity: 0.9
                        }
                      ]}>
                        <View style={[
                          styles.dailyBarGradient,
                          {
                            backgroundColor: CHART_COLORS.tertiary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.dailyBarHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                    </View>
                    
                    {/* Line graph overlay */}
                    <View style={styles.lineGraphOverlay}>
                      {/* Calculate line path connecting all bars */}
                      <View style={styles.lineGraphPath}>
                        {data.map((item, index) => {
                          const totalHeight = (item.total / maxValue) * 150;
                          const barWidth = 60; // Width of each bar column
                          const spacing = 20; // Spacing between bars
                          const x = index * (barWidth + spacing); // X coordinate (horizontal)
                          const y = 150 - totalHeight; // Y coordinate (vertical, inverted for chart)
                          
                          return (
                            <View key={index} style={[
                              styles.lineGraphPoint,
                              {
                                left: `${x + barWidth/2 - 6}px`, // X coordinate (center of bar)
                                bottom: `${y - 6}px` // Y coordinate (top of bar)
                              }
                            ]}>
                              <View style={[
                                styles.lineGraphDot,
                                {
                                  backgroundColor: CHART_COLORS.primary,
                                  borderColor: '#FFFFFF'
                                }
                              ]} />
                            </View>
                          );
                        })}
                        
                        {/* Connect the dots with lines */}
                        {data.map((item, index) => {
                          if (index === 0) return null;
                          
                          const currentHeight = (item.total / maxValue) * 150;
                          const prevHeight = (data[index - 1].total / maxValue) * 150;
                          const barWidth = 60;
                          const spacing = 20;
                          
                          const currentX = index * (barWidth + spacing) + barWidth/2; // X coordinate (center of current bar)
                          const prevX = (index - 1) * (barWidth + spacing) + barWidth/2; // X coordinate (center of previous bar)
                          const lineLength = currentX - prevX; // Line length in pixels
                          
                          const currentY = 150 - currentHeight; // Y coordinate (inverted)
                          const prevY = 150 - prevHeight; // Y coordinate (inverted)
                          const heightDiff = Math.abs(currentY - prevY); // Height difference
                          
                          return (
                            <View key={`line-${index}`} style={[
                              styles.lineGraphLine,
                              {
                                left: `${prevX}px`, // X coordinate (start point)
                                width: `${lineLength}px`, // Width (horizontal distance)
                                bottom: `${Math.min(currentY, prevY)}px`, // Y coordinate (lower of two points)
                                height: `${heightDiff}px`, // Height (vertical distance)
                                backgroundColor: CHART_COLORS.primary,
                                opacity: 0.8
                              }
                            ]} />
                          );
                        })}
                      </View>
                    </View>
                    
                    {item.total > 0 && (
                      <Text style={[styles.barValue, { color: theme.colors.text, fontSize: windowWidth > 380 ? 8 : 7 }]}>
                        {item.total}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderBarChart = (data, maxValue) => {
    return (
      <View style={styles.barChartContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chartScroll}
          contentContainerStyle={styles.chartScrollContent}
        >
          <View style={styles.chartArea}>
            {data.map((item, index) => {
              const dailyHeight = (item.daily / maxValue) * 150;
              const moodHeight = (item.mood / maxValue) * 150;
              const discoverHeight = (item.discover / maxValue) * 150;
              
              return (
                <View key={index} style={styles.barChartBar}>
                  <View style={styles.barLabel}>
                    <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                      {item.month}
                    </Text>
                  </View>
                  <View style={styles.barChartWrapper}>
                    {/* Gradient area fill */}
                    <View style={[
                      styles.gradientArea,
                      {
                        height: Math.max(dailyHeight, moodHeight, discoverHeight),
                        backgroundColor: CHART_COLORS.primary,
                        opacity: 0.2
                      }
                    ]} />
                    
                    {/* Horizontal bars with rounded corners */}
                    <View style={styles.areaChartBars}>
                      {/* Daily bar */}
                      <View style={[
                        styles.areaChartBar,
                        {
                          height: dailyHeight,
                          backgroundColor: CHART_COLORS.primary,
                          opacity: 0.9,
                          borderRadius: 6,
                          marginBottom: 4
                        }
                      ]}>
                        <View style={[
                          styles.areaChartGradient,
                          {
                            backgroundColor: CHART_COLORS.primary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.areaChartHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                      
                      {/* Mood bar */}
                      <View style={[
                        styles.areaChartBar,
                        {
                          height: moodHeight,
                          backgroundColor: CHART_COLORS.secondary,
                          opacity: 0.9,
                          borderRadius: 6,
                          marginBottom: 4
                        }
                      ]}>
                        <View style={[
                          styles.areaChartGradient,
                          {
                            backgroundColor: CHART_COLORS.secondary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.areaChartHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                      
                      {/* Discover bar */}
                      <View style={[
                        styles.areaChartBar,
                        {
                          height: discoverHeight,
                          backgroundColor: CHART_COLORS.tertiary,
                          opacity: 0.9,
                          borderRadius: 6
                        }
                      ]}>
                        <View style={[
                          styles.areaChartGradient,
                          {
                            backgroundColor: CHART_COLORS.tertiary,
                            opacity: 0.4
                          }
                        ]} />
                        <View style={[
                          styles.areaChartHighlight,
                          {
                            backgroundColor: '#FFFFFF',
                            opacity: 0.3
                          }
                        ]} />
                      </View>
                    </View>
                    
                    {item.total > 0 && (
                      <Text style={[styles.barValue, { color: theme.colors.text, fontSize: windowWidth > 380 ? 8 : 7 }]}>
                        {item.total}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderPieChart = (data, maxValue) => {
    return (
      <View style={[styles.pieChartContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pieChartScroll}
          contentContainerStyle={styles.pieChartScrollContent}
        >
          {data.map((item, index) => {
            const colors = [
              CHART_COLORS.primary,
              CHART_COLORS.secondary,
              CHART_COLORS.tertiary,
              CHART_COLORS.quaternary,
              CHART_COLORS.quinary,
              CHART_COLORS.senary,
              CHART_COLORS.septenary
            ];
            
            // Create pie segments for each year
            const total = data.reduce((sum, d) => sum + d.total, 0);
            const percentage = (item.total / total) * 100;
            const radius = windowWidth > 380 ? 60 : 50;
            const innerRadius = radius * 0.6; // Donut hole
            
            return (
              <View key={index} style={styles.pieChartItem}>
                <View style={styles.pieChartLabel}>
                  <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                    {item.year}
                  </Text>
                </View>
                <View style={styles.pieChartVisual}>
                  {/* Donut chart with segments */}
                  <View style={styles.donutContainer}>
                    {/* Outer ring */}
                    <View
                      style={[
                        styles.donutOuter,
                        {
                          width: radius * 2,
                          height: radius * 2,
                          borderRadius: radius,
                          backgroundColor: colors[index % colors.length],
                          opacity: 0.9
                        }
                      ]}
                    />
                    {/* Inner circle (donut hole) */}
                    <View
                      style={[
                        styles.donutInner,
                        {
                          width: innerRadius * 2,
                          height: innerRadius * 2,
                          borderRadius: innerRadius,
                          backgroundColor: isDark ? '#000000' : theme.colors.surface,
                          position: 'absolute',
                          top: radius - innerRadius,
                          left: radius - innerRadius
                        }
                      ]}
                    />
                    {/* Center text */}
                    <View style={styles.donutCenter}>
                      <Text style={[
                        styles.donutValue,
                        { 
                          color: theme.colors.text,
                          fontSize: windowWidth > 380 ? 14 : 12
                        }
                      ]}>
                        {item.total}
                      </Text>
                      <Text style={[
                        styles.donutPercentage,
                        { 
                          color: theme.colors.textMuted,
                          fontSize: windowWidth > 380 ? 10 : 8
                        }
                      ]}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderPeriodSelector = () => {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];
    
    return (
      <View style={[styles.periodSelector, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period ? (isDark ? '#8B5CF6' : theme.colors.primary) : (isDark ? '#1E1E1E' : theme.colors.surface),
                borderColor: isDark ? '#333' : theme.colors.border,
                shadowColor: '#7A6FA3',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 12,
              }
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period ? '#FFFFFF' : (isDark ? '#FFFFFF' : theme.colors.text),
                  fontSize: windowWidth > 380 ? 12 : 10
                }
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStatsCards = () => {
    const dynamicStyles = {
      statCard: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4%',
        marginHorizontal: '1%',
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
        borderColor: isDark ? '#333' : theme.colors.border,
        minHeight: 100,
        maxWidth: '30%',
        shadowColor: '#7A6FA3',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 12,
      },
      statIcon: {
        marginBottom: '4%',
      },
      statValue: {
        fontWeight: '700',
        color: isDark ? '#FFFFFF' : theme.colors.text,
        fontSize: 24,
        lineHeight: 32,
        textAlign: 'center',
      },
      statLabel: {
        marginTop: '4%',
        color: isDark ? '#A0A0A0' : theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
      }
    };

    return (
      <View style={styles.statsContainer}>
        <View style={dynamicStyles.statCard}>
          <View style={dynamicStyles.statIcon}>
            <Ionicons name="flame" size={24} color={theme.colors.primary} />
          </View>
          <Text style={dynamicStyles.statValue}>
            {streakData.currentStreak}
          </Text>
          <Text style={dynamicStyles.statLabel}>
            Current Streak
          </Text>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <View style={dynamicStyles.statIcon}>
            <Ionicons name="trophy" size={24} color={theme.colors.primary} />
          </View>
          <Text style={dynamicStyles.statValue}>
            {streakData.longestStreak}
          </Text>
          <Text style={dynamicStyles.statLabel}>
            Longest Streak
          </Text>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <View style={dynamicStyles.statIcon}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
          </View>
          <Text style={dynamicStyles.statValue}>
            {streakData.totalDays}
          </Text>
          <Text style={dynamicStyles.statLabel}>
            Total Submissions
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading progress data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Function to generate SVG for bar chart
  const generateBarChartSVG = (data, width = 300, height = 150, color = '#8B5CF6') => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barWidth = (width - 40) / data.length - 10;
    const chartHeight = height - 40;
    
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="#ffffff" />
        ${data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 20);
          const x = 30 + i * (barWidth + 10);
          const y = chartHeight - barHeight;
          return `
            <g key="${i}">
              <rect 
                x="${x}" 
                y="${y}" 
                width="${barWidth}" 
                height="${barHeight}" 
                fill="${color}" 
                opacity="0.8"
                rx="2"
                ry="2"
              />
              <text 
                x="${x + barWidth / 2}" 
                y="${y - 5}" 
                text-anchor="middle" 
                font-size="10" 
                fill="#666"
              >
                ${item.value}
              </text>
              <text 
                x="${x + barWidth / 2}" 
                y="${chartHeight + 15}" 
                text-anchor="middle" 
                font-size="9" 
                fill="#666"
                transform="rotate(-45, ${x + barWidth / 2}, ${chartHeight + 15})"
              >
                ${item.label}
              </text>
            </g>
          `;
        }).join('')}
        <line 
          x1="25" 
          y1="0" 
          x2="25" 
          y2="${chartHeight}" 
          stroke="#e0e0e0" 
          stroke-width="1"
        />
        <line 
          x1="25" 
          y1="${chartHeight}" 
          x2="${width - 5}" 
          y2="${chartHeight}" 
          stroke="#e0e0e0" 
          stroke-width="1"
        />
      </svg>
    `;
  };

  // Function to generate SVG for pie chart
  const generatePieChartSVG = (data, width = 200, height = 200) => {
    const radius = Math.min(width, height) / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;
    let cumulativePercent = 0;
    
    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Generate SVG path for each segment
    const paths = data.map((item, i) => {
      const percentage = item.value / total;
      const startX = centerX + radius * Math.cos(2 * Math.PI * cumulativePercent);
      const startY = centerY + radius * Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += percentage;
      const endX = centerX + radius * Math.cos(2 * Math.PI * cumulativePercent);
      const endY = centerY + radius * Math.sin(2 * Math.PI * cumulativePercent);
      
      // If the slice is more than 50%, take the large arc flag
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      
      return `
        <path 
          d="M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z"
          fill="${item.color}"
          stroke="#ffffff"
          stroke-width="1"
        />
      `;
    }).join('');
    
    // Add labels
    const labels = data.map((item, i) => {
      const percentage = item.value / total;
      const angle = 2 * Math.PI * (cumulativePercent - percentage / 2);
      const labelRadius = radius * 0.7;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      return `
        <circle cx="${x}" cy="${y}" r="2" fill="${item.color}" />
        <text 
          x="${x + (x > centerX ? 5 : -5)}" 
          y="${y + 3}" 
          text-anchor="${x > centerX ? 'start' : 'end'}" 
          font-size="8" 
          fill="#666"
        >
          ${item.label} (${Math.round(percentage * 100)}%)
        </text>
      `;
    }).join('');
    
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#f5f5f5" />
        ${paths}
        ${labels}
      </svg>
    `;
  };

  // Function to generate SVG for line chart
  const generateLineChartSVG = (data, width = 400, height = 200, color = '#8B5CF6') => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartWidth = width - 40;
    const chartHeight = height - 40;
    
    // Generate points for the line
    const points = data.map((item, i) => {
      const x = 30 + (i * chartWidth) / (data.length - 1);
      const y = chartHeight - (item.value / maxValue) * (chartHeight - 20);
      return `${x},${y}`;
    }).join(' ');
    
    // Generate area points (for fill)
    const areaPoints = `${points} ${30 + chartWidth},${chartHeight} 30,${chartHeight}`;
    
    // Generate x-axis labels
    const xLabels = data.map((item, i) => {
      const x = 30 + (i * chartWidth) / (data.length - 1);
      return `
        <text 
          x="${x}" 
          y="${chartHeight + 15}" 
          text-anchor="middle" 
          font-size="9" 
          fill="#666"
        >
          ${item.label}
        </text>
      `;
    }).join('');
    
    // Generate y-axis labels
    const yLabels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = Math.round((maxValue / steps) * (steps - i));
      const y = (i * chartHeight) / steps + 10;
      yLabels.push(`
        <text 
          x="25" 
          y="${y}" 
          text-anchor="end" 
          font-size="9" 
          fill="#999"
          dominant-baseline="middle"
        >
          ${value}
        </text>
        <line 
          x1="30" 
          y1="${y}" 
          x2="${width - 10}" 
          y2="${y}" 
          stroke="#f0f0f0" 
          stroke-width="1" 
          stroke-dasharray="2,2"
        />
      `);
    }
    
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="#ffffff" />
        
        <!-- Grid lines -->
        <line 
          x1="30" 
          y1="0" 
          x2="30" 
          y2="${chartHeight}" 
          stroke="#e0e0e0" 
          stroke-width="1"
        />
        <line 
          x1="30" 
          y1="${chartHeight}" 
          x2="${width - 10}" 
          y2="${chartHeight}" 
          stroke="#e0e0e0" 
          stroke-width="1"
        />
        
        <!-- Y-axis labels -->
        ${yLabels.join('')}
        
        <!-- Area fill -->
        <polygon 
          points="${areaPoints}" 
          fill="${color}" 
          fill-opacity="0.1" 
          stroke="none"
        />
        
        <!-- Line -->
        <polyline 
          points="${points}" 
          fill="none" 
          stroke="${color}" 
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        <!-- Dots -->
        ${data.map((item, i) => {
          const x = 30 + (i * chartWidth) / (data.length - 1);
          const y = chartHeight - (item.value / maxValue) * (chartHeight - 20);
          return `
            <circle 
              cx="${x}" 
              cy="${y}" 
              r="3" 
              fill="${color}" 
              stroke="#ffffff" 
              stroke-width="1.5"
            />
          `;
        }).join('')}
        
        <!-- X-axis labels -->
        ${xLabels}
      </svg>
    `;
  };

  const generateAndSharePDF = async () => {
    try {
      // Generate HTML content for the PDF
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Format dates for the last 7 days
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric' 
        });
      };

      // Generate data for the last 7 days
      const last7Days = [];
      const dailyChartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const questions = Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : 0;
        last7Days.push({
          date: formatDate(date),
          questions,
          status: questions > 0 ? 'Completed' : 'No activity'
        });
        dailyChartData.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
          value: questions
        });
      }

      // Weekly overview data (last 4 weeks)
      const weeklyData = [
        { week: 'Jan 28 - Feb 3', questions: 12, avgPerDay: 1.7, progress: 85 },
        { week: 'Jan 21 - Jan 27', questions: 10, avgPerDay: 1.4, progress: 70 },
        { week: 'Jan 14 - Jan 20', questions: 8, avgPerDay: 1.1, progress: 55 },
        { week: 'Jan 7 - Jan 13', questions: 15, avgPerDay: 2.1, progress: 100 }
      ];

      // Monthly summary (last 6 months)
      const monthlyData = [
        { month: 'January 2024', questions: 45, avgPerDay: 1.5, trend: '↑' },
        { month: 'December 2023', questions: 42, avgPerDay: 1.4, trend: '↑' },
        { month: 'November 2023', questions: 38, avgPerDay: 1.3, trend: '→' },
        { month: 'October 2023', questions: 40, avgPerDay: 1.3, trend: '↓' },
        { month: 'September 2023', questions: 45, avgPerDay: 1.5, trend: '↑' },
        { month: 'August 2023', questions: 43, avgPerDay: 1.4, trend: '↑' }
      ];

      // Yearly overview
      const yearlyData = [
        { year: '2022', questions: 480, avgPerMonth: 40, growth: '12%' },
        { year: '2023', questions: 510, avgPerMonth: 42.5, growth: '6%' },
        { year: '2024', questions: 45, avgPerMonth: 45, growth: '5%' },
        { year: '2025', questions: 0, avgPerMonth: 0, growth: '-' },
        { year: '2026', questions: 0, avgPerMonth: 0, growth: '-' }
      ];

      // Create HTML content for the PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              color: #333; 
              max-width: 100%;
              margin: 0 auto;
              font-size: 12px;
              line-height: 1.4;
            }
            .report-header { 
              text-align: center; 
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #f0f0f0;
            }
            .report-title {
              color: #4a4a4a;
              font-size: 22px;
              font-weight: 600;
              margin: 0 0 5px 0;
            }
            .report-subtitle {
              color: #8B5CF6;
              font-size: 16px;
              margin: 0 0 10px 0;
              font-weight: 500;
            }
            .report-date {
              color: #666;
              font-size: 12px;
              margin: 0;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              color: #4a4a4a;
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #f0f0f0;
            }
            .card {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              padding: 15px;
              margin-bottom: 20px;
              border: 1px solid #eee;
            }
            .stat-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f5f5f5;
            }
            .stat-row:last-child {
              border-bottom: none;
            }
            .stat-label {
              color: #666;
              font-weight: 500;
            }
            .stat-value {
              color: #4a4a4a;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 11px;
            }
            th {
              text-align: left;
              padding: 8px 12px;
              background-color: #f8f9fa;
              color: #666;
              font-weight: 600;
              border-bottom: 1px solid #eee;
            }
            td {
              padding: 8px 12px;
              border-bottom: 1px solid #f5f5f5;
              color: #4a4a4a;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .progress-bar {
              height: 6px;
              background-color: #e9ecef;
              border-radius: 3px;
              margin-top: 4px;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #8B5CF6, #6D28D9);
              border-radius: 3px;
            }
            .insights {
              background-color: #f8f5ff;
              border-left: 4px solid #8B5CF6;
              padding: 15px;
              border-radius: 0 8px 8px 0;
              margin-top: 20px;
            }
            .insight-item {
              margin-bottom: 10px;
              display: flex;
              align-items: flex-start;
            }
            .insight-item:last-child {
              margin-bottom: 0;
            }
            .emoji {
              margin-right: 8px;
              font-size: 14px;
              margin-top: 2px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #f0f0f0;
              color: #999;
              font-size: 11px;
            }
            @media print {
              body {
                padding: 10mm;
              }
              .section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1 class="report-title">Your Progress Insights</h1>
            <div class="report-date">${currentDate}</div>
          </div>
          
          <!-- Streak Stats Section -->
          <div class="section">
            <h2 class="section-title">Your Streak Stats</h2>
            <div class="card">
              <div class="stat-row">
                <span class="stat-label">Current Streak</span>
                <span class="stat-value">${streakData.currentStreak} day${streakData.currentStreak !== 1 ? 's' : ''}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Longest Streak</span>
                <span class="stat-value">${streakData.longestStreak} day${streakData.longestStreak !== 1 ? 's' : ''}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Submissions</span>
                <span class="stat-value">${streakData.totalDays}</span>
              </div>
            </div>
          </div>
          
          <!-- Daily Progress Section -->
          <div class="section">
            <h2 class="section-title">Daily Progress (Last 7 Days)</h2>
            <div class="card">
              <div style="margin-bottom: 15px;">
                ${generateLineChartSVG(dailyChartData, 500, 200, '#8B5CF6')}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${last7Days.map(day => `
                    <tr>
                      <td>${day.date}</td>
                      <td>${day.questions || ''}</td>
                      <td>${day.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Weekly Overview Section -->
          <div class="section">
            <h2 class="section-title">Weekly Overview (Last 4 Weeks)</h2>
            <div class="card">
              <div style="margin-bottom: 15px; text-align: center;">
                ${generateBarChartSVG(
                  weeklyData.map(week => ({
                    label: week.week.split(' - ')[0].split(' ')[1],
                    value: week.questions
                  })),
                  500,
                  200,
                  '#3B82F6'
                )}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Questions</th>
                    <th>Avg. per day</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  ${weeklyData.map(week => `
                    <tr>
                      <td>${week.week}</td>
                      <td>${week.questions}</td>
                      <td>${week.avgPerDay}</td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 50px;">
                            <div class="progress-bar">
                              <div class="progress-fill" style="width: ${week.progress}%"></div>
                            </div>
                          </div>
                          <span>${week.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Monthly Summary Section -->
          <div class="section">
            <h2 class="section-title">Monthly Summary (Last 6 Months)</h2>
            <div class="card">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="flex: 1; text-align: center;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Questions by Month</div>
                  ${generateBarChartSVG(
                    monthlyData.map(month => ({
                      label: month.month.split(' ')[0].substring(0, 3),
                      value: month.questions
                    })),
                    400,
                    200,
                    '#10B981'
                  )}
                </div>
                <div style="flex: 1; text-align: center;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Daily Average</div>
                  ${generateLineChartSVG(
                    monthlyData.map(month => ({
                      label: month.month.split(' ')[0].substring(0, 3),
                      value: month.avgPerDay
                    })),
                    400,
                    200,
                    '#F59E0B'
                  )}
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Questions</th>
                    <th>Avg. per day</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyData.map(month => `
                    <tr>
                      <td>${month.month}</td>
                      <td>${month.questions}</td>
                      <td>${month.avgPerDay}</td>
                      <td style="color: ${month.trend === '↑' ? '#10B981' : month.trend === '↓' ? '#EF4444' : '#6B7280'}">
                        ${month.trend}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Yearly Overview Section -->
          <div class="section">
            <h2 class="section-title">Yearly Overview</h2>
            <div class="card">
              <div style="text-align: center; margin-bottom: 15px;">
                ${generatePieChartSVG(
                  yearlyData
                    .filter(year => year.questions > 0)
                    .map((year, i) => ({
                      label: year.year,
                      value: year.questions,
                      color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i % 5]
                    })),
                  400,
                  250
                )}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Questions</th>
                    <th>Avg. per month</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  ${yearlyData.map((year, i) => {
                    const color = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i % 5];
                    return `
                      <tr>
                        <td>
                          <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                          ${year.year}
                        </td>
                        <td>${year.questions || '-'}</td>
                        <td>${year.avgPerMonth || '-'}</td>
                        <td style="color: ${year.growth === '-' ? '#6B7280' : year.growth.includes('-') ? '#EF4444' : '#10B981'}">
                          ${year.growth}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Progress Insights Section -->
          <div class="section">
            <h2 class="section-title">Your Progress Insights</h2>
            <div class="insights">
              <div class="insight-item">
                <span class="emoji">🔥</span>
                <span>You're on a ${streakData.currentStreak}-day streak! Keep it up!</span>
              </div>
              <div class="insight-item">
                <span class="emoji">🏆</span>
                <span>Your best week was 15 questions. Great job!</span>
              </div>
              <div class="insight-item">
                <span class="emoji">📊</span>
                <span>You've completed ${streakData.totalDays} total submissions.</span>
              </div>
              <div class="insight-item">
                <span class="emoji">💪</span>
                <span>You're doing better than 75% of users this month.</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Generated by Unfold Cards • ${currentDate}
          </div>
        </body>
        </html>
      `;

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      // Share the PDF file
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Progress Report',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);
      Alert.alert('Error', 'Failed to generate or share the progress report. Please try again.');
    }
  };

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#000000" : "#FFFFFF"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#000000' : '#FFFFFF', borderBottomColor: isDark ? '#333' : '#E6D6FF' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : theme.colors.text }]}>
            Progress
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]} onPress={loadProgressData}>
            <Ionicons name="refresh" size={24} color={isDark ? '#FFFFFF' : theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        {renderStatsCards()}
        
        {/* Period Selector */}
        {renderPeriodSelector()}
        
        {/* Multi-Color Chart */}
        {renderMultiColorChart()}
        
        {/* Insights */}
        <View style={[
          styles.insightsContainer, 
          { 
            backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface, 
            borderColor: isDark ? '#333' : theme.colors.border,
            shadowColor: '#7A6FA3',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 12,
          }
        ]}>
          <Text style={[
            styles.insightsTitle, 
            { 
              color: theme.colors.text,
              fontSize: windowWidth > 380 ? 18 : 16
            }
          ]}>
            Streak Insights
          </Text>
          <Text style={[
            styles.insightsText, 
            { 
              color: theme.colors.textMuted,
              fontSize: windowWidth > 380 ? 14 : 12,
              lineHeight: windowWidth > 380 ? 20 : 18
            }
          ]}>
            {streakData.currentStreak > 0 
              ? `🔥 Great job! You're on a ${streakData.currentStreak}-day streak! Keep it up!`
              : '🎯 Start your streak today by answering your daily question!'}
          </Text>
          {streakData.longestStreak > streakData.currentStreak && (
            <Text style={[
              styles.insightsText, 
              { 
                color: theme.colors.textMuted,
                fontSize: windowWidth > 380 ? 14 : 12,
                lineHeight: windowWidth > 380 ? 20 : 18
              }
            ]}>
              🏆 Your longest streak was {streakData.longestStreak} days. You can beat it!
            </Text>
          )}
          <Text style={[
            styles.insightsText, 
            { 
              color: theme.colors.textMuted,
              fontSize: windowWidth > 380 ? 14 : 12,
              lineHeight: windowWidth > 380 ? 20 : 18
            }
          ]}>
            📊 You've completed {streakData.totalDays} total submissions across all question types.
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.shareButton, { backgroundColor: theme.colors.primary }]} 
          onPress={generateAndSharePDF}
        >
          <Ionicons name="document" size={24} color="white" style={styles.shareIcon} />
          <Text style={styles.shareButtonText}>Share as PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingTop:50
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginRight:30
  },
  backButton: {
    padding: 8,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    marginVertical: 20,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  multiChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingHorizontal: 4,
  },
  // Line Chart Styles
  lineChartContainer: {
    marginVertical: 10,
  },
  chartScroll: {
    flex: 1,
  },
  chartScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    minHeight: 200,
  },
  lineChartBar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    minWidth: 60,
  },
  lineChartWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: 150,
    position: 'relative',
  },
  dailyBarsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  weeklyBarsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  monthlyBarsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  dailyBar: {
    width: 8,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  dailyBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  dailyBarHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },
  lineGraphOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    pointerEvents: 'none',
    zIndex: 10,
  },
  lineGraphPath: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  lineGraphPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    transform: [{ translateX: -6 }, { translateY: -6 }],
    zIndex: 10,
  },
  lineGraphDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  lineGraphLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: 'left center',
    zIndex: 5,
  },
  // Area Chart Styles
  areaChartContainer: {
    marginVertical: 10,
  },
  areaChartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  areaChartWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: 150,
  },
  weeklyBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
  },
  weeklyBar: {
    width: 12,
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  weeklyBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  // Bar Chart Styles
  barChartContainer: {
    marginVertical: 10,
  },
  barChartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  barChartWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: 150,
  },
  monthlyBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  monthlyBarSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 0.5,
  },
  monthlyBar: {
    width: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  monthlyBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  monthlyBarHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },
  // Pie Chart Styles
  pieChartContainer: {
    marginVertical: 10,
  },
  pieChartScroll: {
    flex: 1,
  },
  pieChartScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    minHeight: 150,
  },
  pieChartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 150,
  },
  pieChartItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    minWidth: 100,
  },
  pieChartLabel: {
    marginBottom: 8,
  },
  pieChartVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuter: {
    position: 'relative',
  },
  donutInner: {
    position: 'absolute',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    fontWeight: '700',
    textAlign: 'center',
  },
  donutPercentage: {
    textAlign: 'center',
    marginTop: 2,
  },
  monthlyPieLegend: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  monthlyPieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  monthlyPieLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 8,
  },
  monthlyPieLegendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  fallbackPieContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingHorizontal: 10,
  },
  fallbackPieSlice: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginHorizontal: 4,
  },
  fallbackPieBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  fallbackPieLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 2,
  },
  fallbackPiePercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Hexagon Chart Styles
  hexagonChartContainer: {
    marginVertical: 10,
  },
  hexagonChartArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  hexagonChartItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 100,
  },
  hexagonChartLabel: {
    marginBottom: 8,
  },
  hexagonChartVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hexagonChartValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  hexagonLegend: {
    alignItems: 'flex-start',
  },
  hexagonLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hexagonLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  hexagonLegendText: {
    fontSize: 9,
    fontWeight: '500',
  },
  // Weekly Chart Fallback Styles
  weeklyChartContainer: {
    marginVertical: 10,
  },
  weeklyChartArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  weeklyChartItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 80,
  },
  weeklyChartLabel: {
    marginBottom: 8,
  },
  weeklyChartVisual: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
    marginBottom: 8,
  },
  weeklyBarsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  weeklyBar: {
    width: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  weeklyChartValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  weeklyLegend: {
    alignItems: 'flex-start',
  },
  weeklyLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  weeklyLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  weeklyLegendText: {
    fontSize: 8,
    fontWeight: '500',
  },
  // Semi-Circle Chart Styles
  semiCircleChartContainer: {
    marginVertical: 10,
  },
  semiCircleChartArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  semiCircleChartItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 100,
  },
  semiCircleChartLabel: {
    marginBottom: 8,
  },
  semiCircleChartVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  semiCircleChartValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  semiCircleLegend: {
    alignItems: 'flex-start',
  },
  semiCircleLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  semiCircleLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  semiCircleLegendText: {
    fontSize: 9,
    fontWeight: '500',
  },
  // True Semi-Circle Chart Styles
  semiCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  semiCircleCircularContainer: {
    position: 'relative',
  },
  semiCircleFullBackground: {
    position: 'absolute',
  },
  semiCirclePieContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  semiCircleWedge: {
    position: 'absolute',
  },
  semiCircleEmpty: {
    position: 'absolute',
  },
  semiCircleSegmentLabel: {
    fontSize: 8,
    fontWeight: '500',
    marginBottom: 2,
  },
  semiCircleSegmentValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Common chart styles
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingHorizontal: 4,
  },
  multiBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  barLabel: {
    marginBottom: 8,
  },
  barLabelText: {
    fontSize: 9,
    fontWeight: '500',
  },
  multiBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    flexDirection: 'row',
  },
  stackedBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
  },
  barSegment: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  barValue: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  insightsContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 20,
    marginBottom: 40,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  barLabelText: {
    fontSize: 9,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

export { ProgressScreen };
