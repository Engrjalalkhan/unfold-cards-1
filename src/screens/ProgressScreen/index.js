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
  useWindowDimensions
} from 'react-native';
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
  const { theme } = useTheme();
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
      
      // Get streak data
      const streakInfo = await StreakManager.getStreakData();
      
      // Get all submissions for detailed analysis
      const dailySubmissions = await AsyncStorage.getItem('dailySubmissions');
      const moodSubmissions = await AsyncStorage.getItem('moodSubmissions');
      const discoverSubmissions = await AsyncStorage.getItem('discoverSubmissions');
      
      const daily = dailySubmissions ? JSON.parse(dailySubmissions) : [];
      const mood = moodSubmissions ? JSON.parse(moodSubmissions) : [];
      const discover = discoverSubmissions ? JSON.parse(discoverSubmissions) : [];
      
      // Combine all submissions
      const allSubmissions = [...daily, ...mood, ...discover];
      
      // Process data for different periods
      const dailyData = processDailyStreakData(allSubmissions);
      const weeklyData = processWeeklyStreakData(allSubmissions);
      const monthlyData = processMonthlyStreakData(allSubmissions);
      const yearlyData = processYearlyStreakData(allSubmissions);
      
      // Calculate longest streak
      const longestStreak = calculateLongestStreak(allSubmissions);
      
      setStreakData({
        currentStreak: streakInfo.streakDays,
        longestStreak,
        totalDays: allSubmissions.length,
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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + index);
      const dateKey = date.toISOString().split('T')[0];
      
      const submissionsOnDay = submissions.filter(sub => 
        sub.timestamp && sub.timestamp.startsWith(dateKey)
      );
      
      // Count different types of submissions
      const dailyQuestions = submissionsOnDay.filter(sub => sub.type === 'daily').length;
      const moodQuestions = submissionsOnDay.filter(sub => sub.type === 'mood').length;
      const discoverQuestions = submissionsOnDay.filter(sub => sub.type === 'discover').length;
      
      return {
        day,
        date: dateKey,
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: submissionsOnDay.length,
        hasData: submissionsOnDay.length > 0
      };
    });
    
    return weekData;
  };

  const processWeeklyStreakData = (submissions) => {
    const weeks = [];
    const today = new Date();
    
    // Get last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const submissionsInWeek = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const subDate = new Date(sub.timestamp);
        return subDate >= weekStart && subDate <= weekEnd;
      });
      
      const dailyQuestions = submissionsInWeek.filter(sub => sub.type === 'daily').length;
      const moodQuestions = submissionsInWeek.filter(sub => sub.type === 'mood').length;
      const discoverQuestions = submissionsInWeek.filter(sub => sub.type === 'discover').length;
      
      weeks.push({
        week: `W${8 - i}`,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: submissionsInWeek.length,
        hasData: submissionsInWeek.length > 0
      });
    }
    
    return weeks;
  };

  const processMonthlyStreakData = (submissions) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const yearData = months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0);
      
      const submissionsInMonth = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const subDate = new Date(sub.timestamp);
        return subDate >= monthStart && subDate <= monthEnd;
      });
      
      const dailyQuestions = submissionsInMonth.filter(sub => sub.type === 'daily').length;
      const moodQuestions = submissionsInMonth.filter(sub => sub.type === 'mood').length;
      const discoverQuestions = submissionsInMonth.filter(sub => sub.type === 'discover').length;
      
      return {
        month,
        monthIndex: index,
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: submissionsInMonth.length,
        hasData: submissionsInMonth.length > 0
      };
    });
    
    return yearData;
  };

  const processYearlyStreakData = (submissions) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Get last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      
      const submissionsInYear = submissions.filter(sub => {
        if (!sub.timestamp) return false;
        const subDate = new Date(sub.timestamp);
        return subDate >= yearStart && subDate <= yearEnd;
      });
      
      const dailyQuestions = submissionsInYear.filter(sub => sub.type === 'daily').length;
      const moodQuestions = submissionsInYear.filter(sub => sub.type === 'mood').length;
      const discoverQuestions = submissionsInYear.filter(sub => sub.type === 'discover').length;
      
      years.push({
        year: year.toString(),
        daily: dailyQuestions,
        mood: moodQuestions,
        discover: discoverQuestions,
        total: submissionsInYear.length,
        hasData: submissionsInYear.length > 0
      });
    }
    
    return years;
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

    const maxValue = Math.max(...data.map(d => d.total), 1);
    
    const dynamicStyles = {
      chartTitle: {
        fontSize: windowWidth > 380 ? 20 : 18,
        fontWeight: '600',
        color: theme.colors.text
      },
      chartSubtitle: {
        fontSize: windowWidth > 380 ? 16 : 14,
        marginTop: 4,
        color: theme.colors.textMuted
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
        color: theme.colors.textMuted
      }
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={dynamicStyles.chartTitle}>
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Streak Progress
          </Text>
          <Text style={dynamicStyles.chartSubtitle}>
            {selectedPeriod === 'daily' ? 'This Week - Line Chart' :
             selectedPeriod === 'weekly' ? 'Last 8 Weeks - Area Chart' :
             selectedPeriod === 'monthly' ? 'This Year - Bar Chart' : 'Last 5 Years - Pie Chart'}
          </Text>
        </View>
        
        {/* Legend */}
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
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.quaternary }]} />
            <Text style={dynamicStyles.legendText}>Other</Text>
          </View>
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.quinary }]} />
            <Text style={dynamicStyles.legendText}>Bonus</Text>
          </View>
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.senary }]} />
            <Text style={dynamicStyles.legendText}>Extra</Text>
          </View>
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendColor, { backgroundColor: CHART_COLORS.septenary }]} />
            <Text style={dynamicStyles.legendText}>Special</Text>
          </View>
        </View>
        
        {/* Render different chart types based on period */}
        {selectedPeriod === 'daily' && renderLineChart(data, maxValue)}
        {selectedPeriod === 'weekly' && renderAreaChart(data, maxValue)}
        {selectedPeriod === 'monthly' && renderBarChart(data, maxValue)}
        {selectedPeriod === 'yearly' && renderPieChart(data, maxValue)}
      </View>
    );
  };

  const renderLineChart = (data, maxValue) => {
    return (
      <View style={styles.lineChartContainer}>
        <View style={styles.chartArea}>
          {data.map((item, index) => {
            const dailyHeight = (item.daily / maxValue) * 150;
            const moodHeight = (item.mood / maxValue) * 150;
            const discoverHeight = (item.discover / maxValue) * 150;
            
            return (
              <View key={index} style={styles.lineChartBar}>
                <View style={styles.barLabel}>
                  <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                    {item.day}
                  </Text>
                </View>
                <View style={styles.lineChartWrapper}>
                  {/* Gradient area fill */}
                  <View style={[
                    styles.gradientArea,
                    {
                      height: dailyHeight,
                      backgroundColor: CHART_COLORS.primary,
                      opacity: 0.2
                    }
                  ]} />
                  {/* Connected line with dots */}
                  <View style={styles.connectedLine}>
                    {/* Daily line */}
                    <View style={[
                      styles.chartLine,
                      {
                        height: dailyHeight,
                        backgroundColor: CHART_COLORS.primary,
                      }
                    ]}>
                      <View style={[styles.chartDot, { backgroundColor: CHART_COLORS.primary }]} />
                    </View>
                    {/* Mood line */}
                    <View style={[
                      styles.chartLine,
                      {
                        height: moodHeight,
                        backgroundColor: CHART_COLORS.secondary,
                      }
                    ]}>
                      <View style={[styles.chartDot, { backgroundColor: CHART_COLORS.secondary }]} />
                    </View>
                    {/* Discover line */}
                    <View style={[
                      styles.chartLine,
                      {
                        height: discoverHeight,
                        backgroundColor: CHART_COLORS.tertiary,
                      }
                    ]}>
                      <View style={[styles.chartDot, { backgroundColor: CHART_COLORS.tertiary }]} />
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
      </View>
    );
  };

  const renderAreaChart = (data, maxValue) => {
    return (
      <View style={styles.areaChartContainer}>
        <View style={styles.chartArea}>
          {data.map((item, index) => {
            const dailyHeight = (item.daily / maxValue) * 150;
            const moodHeight = (item.mood / maxValue) * 150;
            const discoverHeight = (item.discover / maxValue) * 150;
            
            return (
              <View key={index} style={styles.areaChartBar}>
                <View style={styles.barLabel}>
                  <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                    {item.week}
                  </Text>
                </View>
                <View style={styles.areaChartWrapper}>
                  {/* Gradient bars with rounded corners */}
                  <View style={styles.weeklyBarsContainer}>
                    {/* Daily bar */}
                    <View style={[
                      styles.weeklyBar,
                      {
                        height: dailyHeight,
                        backgroundColor: CHART_COLORS.primary,
                        opacity: 0.8
                      }
                    ]}>
                      <View style={[
                        styles.weeklyBarGradient,
                        {
                          backgroundColor: CHART_COLORS.primary,
                          opacity: 0.3
                        }
                      ]} />
                    </View>
                    {/* Mood bar */}
                    <View style={[
                      styles.weeklyBar,
                      {
                        height: moodHeight,
                        backgroundColor: CHART_COLORS.secondary,
                        opacity: 0.8
                      }
                    ]}>
                      <View style={[
                        styles.weeklyBarGradient,
                        {
                          backgroundColor: CHART_COLORS.secondary,
                          opacity: 0.3
                        }
                      ]} />
                    </View>
                    {/* Discover bar */}
                    <View style={[
                      styles.weeklyBar,
                      {
                        height: discoverHeight,
                        backgroundColor: CHART_COLORS.tertiary,
                        opacity: 0.8
                      }
                    ]}>
                      <View style={[
                        styles.weeklyBarGradient,
                        {
                          backgroundColor: CHART_COLORS.tertiary,
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
      </View>
    );
  };

  const renderBarChart = (data, maxValue) => {
    return (
      <View style={styles.barChartContainer}>
        <View style={styles.chartArea}>
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
            
            // Create 7 different colored segments for each month
            const segments = [];
            for (let i = 0; i < 7; i++) {
              const segmentValue = Math.floor(Math.random() * (item.total / 7)) + 1;
              segments.push({
                color: colors[i],
                value: segmentValue,
                height: (segmentValue / maxValue) * 150
              });
            }
            
            return (
              <View key={index} style={styles.barChartBar}>
                <View style={styles.barLabel}>
                  <Text style={[styles.barLabelText, { color: theme.colors.textMuted, fontSize: windowWidth > 380 ? 9 : 8 }]}>
                    {item.month.substring(0, 3)}
                  </Text>
                </View>
                <View style={styles.barChartWrapper}>
                  {/* Enhanced monthly bars with gradients */}
                  <View style={styles.monthlyBarsContainer}>
                    {segments.map((segment, segIndex) => (
                      <View key={segIndex} style={styles.monthlyBarSegment}>
                        <View style={[
                          styles.monthlyBar,
                          {
                            height: segment.height,
                            backgroundColor: segment.color,
                            opacity: 0.9
                          }
                        ]}>
                          <View style={[
                            styles.monthlyBarGradient,
                            {
                              backgroundColor: segment.color,
                              opacity: 0.4
                            }
                          ]} />
                          {/* Top highlight */}
                          <View style={[
                            styles.monthlyBarHighlight,
                            {
                              backgroundColor: '#FFFFFF',
                              opacity: 0.3
                            }
                          ]} />
                        </View>
                      </View>
                    ))}
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
      </View>
    );
  };

  const renderPieChart = (data, maxValue) => {
    return (
      <View style={styles.pieChartContainer}>
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
                          backgroundColor: theme.colors.surface,
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
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period ? '#FFFFFF' : theme.colors.text,
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4%',
        marginHorizontal: '1%',
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        minHeight: 80,
        maxWidth: '30%',
      },
      statIcon: {
        marginRight: '8%',
      },
      statValue: {
        fontWeight: '700',
        color: theme.colors.text,
        fontSize: 24,
        lineHeight: 32,
      },
      statLabel: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 16,
      }
    };

    return (
      <View style={styles.statsContainer}>
        <View style={dynamicStyles.statCard}>
          <View style={dynamicStyles.statIcon}>
            <Ionicons name="flame" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={dynamicStyles.statValue}>
              {streakData.currentStreak}
            </Text>
            <Text style={dynamicStyles.statLabel}>
              Current Streak
            </Text>
          </View>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <View style={dynamicStyles.statIcon}>
            <Ionicons name="trophy" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={dynamicStyles.statValue}>
              {streakData.longestStreak}
            </Text>
            <Text style={dynamicStyles.statLabel}>
              Longest Streak
            </Text>
          </View>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <View style={dynamicStyles.statIcon}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={dynamicStyles.statValue}>
              {streakData.totalDays}
            </Text>
            <Text style={dynamicStyles.statLabel}>
              Total Submissions
            </Text>
          </View>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: windowWidth > 380 ? 26 : 24 }]}>
          Streak Progress
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadProgressData}>
          <Ionicons name="refresh" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border,
            padding: windowWidth > 380 ? 20 : 16
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
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
  lineChartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  lineChartWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    flexDirection: 'row',
    height: 150,
    position: 'relative',
  },
  gradientArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 4,
  },
  connectedLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  chartLine: {
    width: 3,
    borderRadius: 2,
    position: 'relative',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: -4,
    left: -2.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
