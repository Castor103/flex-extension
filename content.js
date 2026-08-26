
;(function initGlobalConfig() {
  if (!window.myCropPlugin) {
    window.myCropPlugin = {
      class_param_check_load: '.c-upfCI',
      class_param_total_workdone_time: 'span.c-lmXAkT',
      class_param_month_need_worktime_left_time: 'div.c-bAbSmS',
      class_param_workpage_view_type: '.c-bHdqUR > *',    // workpageViewType : 주기, 월, 주
      
      class_param_work_status: 'div.c-gzEFDl > *',        // 현재 근무 상태: 근무중, 휴게중, ...
      class_param_work_time: 'div.c-klJrXp',
      class_param_work_time_side: 'div.c-kIJHMp',
      
      // 토, 일, 공휴일 검색용 클래스 필터값
      //class_param_get_day_and_holiday_parent: 'c-lldrJN',
      //class_param_get_day_and_holiday_parent: 'c-bElvsc',
      class_param_get_day_and_holiday_parent: 'section.c-krCgSO > div.c-lldrJN div.c-gNZGXI div.c-dNTXeN',
      class_param_get_day_and_holiday_child: 'c-bElvsc-fmLUio-colorType-holiday',
      
      class_param_wait_for_section_element: 'section[data-scope="page"][data-part="content"]',
      //class_param_all_day_divs: 'div.c-hzjAHE',
      class_param_all_day_divs: 'section.c-krCgSO > div.c-lldrJN div.c-gNZGXI div.c-fJRAUt',
      //class_param_all_day_divs: 'section.c-krCgSO > div.c-lldrJN > div.c-gNZGXI',
      class_param_day_divs_except_head_row: 'c-bxtDoy',
      //class_param_vacation_button: 'div[type="button"].c-drVVmS-lgczji-color-purple',
      //class_param_vacation_button: 'div[type="button"].c-drVVmS-lgczji-color-purple',
      //class_param_vacation_button: 'div[type="button"].c-ciGsq-lgczji-color-purple',
      class_param_vacation_button: 'div[type="button"].c-iyXem-bstzIN-color-purple',
      
      
      
      // 주기에서 일별 div 바로 상위 section.
      //class_param_get_leave_day_array_at_month_parent: 'section.c-eqXmhd',
      class_param_get_leave_day_array_at_month_parent: 'section.c-pwDdi div.c-diSwZh > div.c-hygrTj',
      //class_param_get_leave_day_array_at_month_parent: 'section.c-krCgSO div.c-lldrJN > div.c-dNTXeN',

      //class_param_get_leave_day_array_at_month_child: 'header.c-eRtORt',
      class_param_get_leave_day_array_at_month_child: 'header.c-eRtORt:not(.c-eRtORt-jjNddC-isWithinIntervalOfInterest-false)',
      class_param_get_leave_day_array_at_month_child_header: 'header.c-eRtORt',
      class_param_get_leave_day_array_at_month_child_include: 'c-eRtORt-jjNddC-isWithinIntervalOfInterest-false',

      //class_param_get_leave_day_array_at_month_leave: '.c-czhgvJ > .c-dYCejv > div[type="button"].c-iUgzqv-lgczji-color-purple',
      class_param_get_leave_day_array_at_month_leave: '.c-czhgvJ > .c-dYCejv > div[type="button"].c-iUgzqv-bstzIN-color-purple',
      class_param_get_duration: 'button.c-hTuUst',
      class_param_count_element_button: 'div[type="button"]',
      //class_param_get_day_and_holiday_at_month_weekday: '.c-ezanJe-fmLUio-isHoliday-true',
      class_param_get_day_and_holiday_at_month_weekday: '.c-bElvsc-fmLUio-colorType-holiday',
      
      // 상태, 설정 등 전역으로 필요한 것들
    }
  }
})();

(() => {

  const header = document.querySelector(window.myCropPlugin.class_param_check_load)
  if (header === undefined) {
    return
  } else {
    fetchDataFunction()
  }

  function fetchDataFunction() {
    waitForSectionElement().then(() => {
      console.log(`rawData: ${document.documentElement.outerHTML}`);

      // 진입 확인용 총 근무 시간
      const totalWorkDoneTime = getElementsWithClass(window.myCropPlugin.class_param_total_workdone_time)

      if (totalWorkDoneTime === 'N/A') {
        //
        return
      } else {
        // workpageViewType : 주기, 월, 주
        const workpageViewType = getElementsInnerTextWithClass(window.myCropPlugin.class_param_workpage_view_type)

        const calculate_flex_worktime_mode = true

        // 크롤데이터
        let data = getData(calculate_flex_worktime_mode, workpageViewType)

        // 플러그인에의한 UI업데이트 부부
        updateAppendUi(calculate_flex_worktime_mode, workpageViewType, data)
      }
    })
  }
})();

function getYearMonthFromDuration(input_text) {
  const match = input_text.match(/(\d{4})\.\s*(\d{1,2})\.\s*\d{1,2}/);

  if (!match) return { year: 0, month: 0 };

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);

  return { year, month };
}

function getData(calculate_flex_worktime_mode, workpageViewType) {
  const updateTime = new Date().toISOString()

  const totalWorkDoneTime = getElementsWithClass(window.myCropPlugin.class_param_total_workdone_time)
  const monthWorkLeftTime = getElementsWithClass(window.myCropPlugin.class_param_month_need_worktime_left_time)
  
  //console.log(`totalWorkDoneTime: ${totalWorkDoneTime}`);
  //console.log(`monthWorkLeftTime: ${monthWorkLeftTime}`);

  // 현재 근무 상태 = 근무중, 휴게중, ...
  const workStatus = getElementsWithClass(window.myCropPlugin.class_param_work_status)

  let leaveDays = 0
  let numberUnuseLeaveDay = 0

  const workSearchDurationInfo = getSearchDurationInfo()
  const durationInfo = getYearMonthFromDuration(workSearchDurationInfo)

  

  const isSearchinfoMatch = isCurrentYearAndMonthInRange(workSearchDurationInfo)

  // 금일 근로 시간 = 8시간 57분
  let todayWorkTime = getElementsWithClass(window.myCropPlugin.class_param_work_time)
  let todayWorkTimeSide = getElementsWithClass(window.myCropPlugin.class_param_work_time_side)

  if (workStatus === 'N/A') {
    todayWorkTime = '0분'
  }

  if (workStatus === '휴게중') {
    todayWorkTime = todayWorkTimeSide
  }

  let totalWeekdays = 0
  let workdoneDayCount = 0
  let totalEffectiveWeekdays = 0
  let childNodesArray = []
  let weekdayHolidays = []
  let findObj = []

  if (workpageViewType === '월') {

    const leaveDayArray = getLeaveDayArrayAtMonthType(durationInfo.month)
    //console.log('leaveDayArray월:', leaveDayArray)
    leaveDays = leaveDayArray.length
    numberUnuseLeaveDay = countUnusedLeaveDays(leaveDayArray)

    findObj = getDayAndHolidayAtMonthType(durationInfo.month)
    childNodesArray = findObj.parantObj
    //console.log(`childNodesArray: [${childNodesArray}]`)

    // 평일에 해당하는 공휴일 계산
    weekdayHolidays = findObj.childObj.filter((day) => {
      // 요일 데이터
      const dayOfWeek = day.slice(-1) // 마지막 문자 추출 (예: "수", "토")
      // 평일 요일만 포함 ("월", "화", "수", "목", "금")
      return ['월', '화', '수', '목', '금'].includes(dayOfWeek)
    })

    const result = calculateMonthlyWeekdaysAndEffectiveDays(weekdayHolidays)

    totalWeekdays = result.totalWeekdays
    workdoneDayCount = result.effectiveWeekdays
    totalEffectiveWeekdays = result.totalEffectiveWeekdays
  } else if (workpageViewType === '주기') {

    const leaveDayArray = getLeaveDayArrayAtWeekcycle()
    findObj = getLeaveDayArrayAtWeekcycleNew()

    //console.log('leaveDayArray주기:', leaveDayArray)
    leaveDays = leaveDayArray.length
    numberUnuseLeaveDay = countUnusedLeaveDays(leaveDayArray)

    // 토, 일, 공휴일 검색용 클래스 필터값
    //findObj = getDayAndHolidayAtWeekcycle(window.myCropPlugin.class_param_get_day_and_holiday_parent, window.myCropPlugin.class_param_get_day_and_holiday_child)
    //findObj = getDayAndHolidayAtWeekcycle(window.myCropPlugin.class_param_get_day_and_holiday_parent, 'c-bElvsc-fmLUio-colorType-holiday')

    childNodesArray = findObj.parantObj
    //console.log(`childNodesArray: [${childNodesArray}]`)
    ///console.log('findObj:', findObj)

    //평일에 해당하는 공휴일 계산
    weekdayHolidays = findObj.childObj.filter((day) => {
      // 요일 데이터
      const dayOfWeek = day.slice(-1) // 마지막 문자 추출 (예: "수", "토")
      // 평일 요일만 포함 ("월", "화", "수", "목", "금")
      return ['월', '화', '수', '목', '금'].includes(dayOfWeek)
    })

    const result = calculateMonthlyWeekdaysAndEffectiveDays(weekdayHolidays)

    totalWeekdays = result.totalWeekdays
    workdoneDayCount = result.effectiveWeekdays
    totalEffectiveWeekdays = result.totalEffectiveWeekdays
  }

  // 계산 실행
  const averageResult = calculateAverageDailyWorkTime(
    todayWorkTime,
    totalWorkDoneTime,
    workdoneDayCount,
  )

  //const averageWorkTime = averageResult.averageDailyWorkHours
  const totalMinutesWorked = averageResult.totalMinutesWorked

  //const totalWorkDoneTimeFormatting = totalWorkDoneTime.split(':')
  const totalWorkDoneTimeHour = Math.floor(Number(totalMinutesWorked / 60))
  const totalWorkDoneTimeMin = Number(totalMinutesWorked % 60)

  const restEffectiveWeekdays = totalEffectiveWeekdays - workdoneDayCount
  let restEffectiveWeekdaysWithoutLeaveDay = restEffectiveWeekdays - numberUnuseLeaveDay

  if (restEffectiveWeekdaysWithoutLeaveDay < 1) {
    restEffectiveWeekdaysWithoutLeaveDay = 1
  }

  //const calculate_flex_work = (35 * childNodesArray.length / 7) - (7 * weekdayHolidays.length);
  const calculate_flex_work = calculateMonthWorkTimeStandard(totalWorkDoneTime, monthWorkLeftTime)

  //let restNeedTime = totalEffectiveWeekdays * 7 * 60 - totalMinutesWorked
  let restNeedTime = calculate_flex_work * 60 - totalMinutesWorked
  
  //console.log(`calculate_flex_work ${calculate_flex_work * 60}, totalMinutesWorked: ${totalMinutesWorked}`)

  if (restNeedTime <= 0) {
    restNeedTime = 0
  }

  const restNeedWorkTimePerDay = (
    restNeedTime /
    restEffectiveWeekdaysWithoutLeaveDay /
    60
  ).toFixed(2)

  //const restNeedWorkTimePerDayFormatting = restNeedWorkTimePerDay.split('.')
  const restNeedWorkTimePerDayHour = Math.floor(restNeedWorkTimePerDay)
  const restNeedWorkTimePerDayMin = Math.round(
    (restNeedWorkTimePerDay - restNeedWorkTimePerDayHour) * 60,
  )

  // 업데이트된 시간 표시
  const timestampString = formatTimestampToKST(updateTime)
  const workdayCount = `${workdoneDayCount} 일` || 'N/A'

  return {
    timestampString: timestampString,
    childNodesArray: childNodesArray,
    weekdayHolidays: weekdayHolidays,
    totalWeekdays: totalWeekdays,
    workdayCount: workdayCount,
    workStatus: workStatus,
    todayWorkTime: todayWorkTime,
    findObj: findObj,
    leaveDays: leaveDays,
    workdoneDayCount: workdoneDayCount,
    totalWorkDoneTime: totalWorkDoneTime,
    monthWorkLeftTime: monthWorkLeftTime,
    totalEffectiveWeekdays: totalEffectiveWeekdays,
    restEffectiveWeekdays: restEffectiveWeekdays,
    numberUnuseLeaveDay: numberUnuseLeaveDay,
    restEffectiveWeekdaysWithoutLeaveDay: restEffectiveWeekdaysWithoutLeaveDay,
    restNeedTime: restNeedTime,
    restNeedWorkTimePerDay: restNeedWorkTimePerDay,
    restNeedWorkTimePerDayHour: restNeedWorkTimePerDayHour,
    restNeedWorkTimePerDayMin: restNeedWorkTimePerDayMin,
    totalWorkDoneTimeHour: totalWorkDoneTimeHour,
    totalWorkDoneTimeMin: totalWorkDoneTimeMin,
  }
}

function countWeekdaysUntilToday() {
  // 현재 날짜를 기준으로 오늘 날짜 구하기
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1 // 월은 0부터 시작하므로 1을 더함
  const currentYear = today.getFullYear()

  let weekdayCount = 0

  // 입력된 연도와 월의 첫날과 마지막 날 계산
  const startDate = new Date(currentYear, currentMonth - 1, 1) // month - 1: 월은 0부터 시작
  const endDate = new Date(currentYear, currentMonth, currentDay) // 해당 월의 마지막 날

  // 1일부터 오늘까지 반복하며 평일만 카운트
  for (
    let day = startDate;
    day <= today && day <= endDate;
    day.setDate(day.getDate() + 1)
  ) {
    // 요일을 확인 (0: 일요일, 1: 월요일, ..., 6: 토요일)
    const weekday = day.getDay()
    // 평일은 1 (월요일)부터 5 (금요일)까지
    if (weekday >= 1 && weekday <= 5) {
      weekdayCount++
    }
  }

  return weekdayCount
}

function isCurrentYearAndMonthInRange(dateRange) {
  // 문자열을 분리하여 연도와 월을 추출합니다.
  const rangeParts = dateRange.split(' – ')
  const startDateParts = rangeParts[0].trim().split('. ')
  const endDateParts = rangeParts[1].trim().split('. ')

  const startYear = parseInt(startDateParts[0])
  const startMonth = parseInt(startDateParts[1])
  const startDay = parseInt(startDateParts[2])

  const endMonth = parseInt(endDateParts[0])
  const endDay = parseInt(endDateParts[1])

  // 현재 날짜
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // getMonth()는 0부터 시작하므로 1을 더함

  // 현재 연도와 월이 시작 연도와 월, 끝 연도와 월 사이에 있는지 확인
  if (currentYear === startYear && currentMonth === startMonth) {
    return true // 현재 연도와 월이 범위 내에 있음
  } else {
    return false // 현재 연도와 월이 범위 밖에 있음
  }
}

function calculateMonthlyWeekdaysAndEffectiveDays(holidays) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 월 (0부터 시작)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate() // 해당 월의 마지막 날

  let totalWeekdays = 0 // 총 평일 수
  let effectiveWeekdays = 0 // 공휴일 제외 평일 수
  let holidaysUntilToday = 0 // 금일까지 공휴일 수
  let totalEffectiveWeekdays = 0 // 총 평일 중 공휴일 제외 일자

  // 1일부터 마지막 날까지 반복
  for (let day = 1; day <= lastDayOfMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dayOfWeek = date.getDay()

    // 평일 확인 (월~금)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalWeekdays++ // 총 평일 수 증가

      // 공휴일 확인
      const holidayFound = holidays.some((holiday) => {
        const [holidayDay, holidayDayOfWeek] = [
          parseInt(holiday),
          holiday.slice(-1),
        ]
        return (
          holidayDay === day &&
          ['월', '화', '수', '목', '금'].includes(holidayDayOfWeek)
        )
      })

      if (!holidayFound) {
        // 공휴일이 아니라면 유효한 평일로 계산
        totalEffectiveWeekdays++
        if (day <= today.getDate()) {
          effectiveWeekdays++
        }
      } else if (day <= today.getDate()) {
        // 금일까지의 공휴일 수 증가
        holidaysUntilToday++
      }
    }
  }

  return {
    totalWeekdays, // 금번 달 총 평일 수
    totalEffectiveWeekdays, // 총 평일 중 공휴일 제외 일자
    effectiveWeekdays, // 금일까지 공휴일 제외 평일 수
    holidaysUntilToday, // 금일까지의 공휴일 수
  }
}

function parseTime(input) {
  // 초기 hour와 minute 값
  let hour = 0;
  let minute = 0;

  // 정규식을 사용해 시간과 분을 추출
  const hourMatch = input.match(/(\d+)\s*시간/); // "n시간" 형식
  const minuteMatch = input.match(/(\d+)\s*분/);  // "n분" 형식

  // 값이 존재하면 정수로 변환
  if (hourMatch) {
      hour = parseInt(hourMatch[1], 10);
  }
  if (minuteMatch) {
      minute = parseInt(minuteMatch[1], 10);
  }

  return { hour, minute };
}

function calculateAverageDailyWorkTime(
  todayWorkTime,
  totalWorkDoneTime,
  weekdaysUntilToday,
) {
  if (todayWorkTime === 'N/A') {
    todayWorkTime = '0시간 0분'
  }

  if (totalWorkDoneTime === 'N/A') {
    totalWorkDoneTime = '0:00'
  }
  
  const todayWorkParse = parseTime(todayWorkTime)
  const todayWorkHours = todayWorkParse.hour
  const todayMinutes = todayWorkParse.minute
  const dailyWorkMinutes = todayWorkHours * 60 + todayMinutes

  //console.log('todayWorkHours:', todayWorkHours)
  //console.log('todayMinutes:', todayMinutes)
  //console.log('totalWorkDoneTime:', totalWorkDoneTime)

  // 당월 근무 총시간 (시:분 형식)
  const totalWorkParts = totalWorkDoneTime.split(':')
  const totalWorkHours = parseInt(totalWorkParts[0])
  const totalWorkMinutes = parseInt(totalWorkParts[1])
  const totalWorkMinutesTotal = totalWorkHours * 60 + totalWorkMinutes
  //console.log('totalWorkParts:', totalWorkParts)
  //console.log('totalWorkHours:', totalWorkHours)
  //console.log('totalWorkMinutes:', totalWorkMinutes)
  //console.log('totalWorkMinutesTotal:', totalWorkMinutesTotal)

  // 오늘까지의 총 근무 시간 (오늘 근무 시간 + 당월 근무 시간)
  let totalMinutesWorked = dailyWorkMinutes + totalWorkMinutesTotal
  //console.log('totalMinutesWorked:', totalMinutesWorked)

  let averageDailyWorkHours = 0

  if (weekdaysUntilToday === 0) {
    // 일당 평균 근로시간 계산 (총 근무 시간 ÷ 평일 수)
    const averageDailyWorkMinutes = totalMinutesWorked
  
    // 평균 근로시간을 시간 단위로 변환 (소수점 2자리까지)
    averageDailyWorkHours = (averageDailyWorkMinutes / 60).toFixed(2)

  } else {
    // 일당 평균 근로시간 계산 (총 근무 시간 ÷ 평일 수)
    const averageDailyWorkMinutes = totalMinutesWorked / weekdaysUntilToday

    // 평균 근로시간을 시간 단위로 변환 (소수점 2자리까지)
    averageDailyWorkHours = (averageDailyWorkMinutes / 60).toFixed(2)
  }

  return {
    averageDailyWorkHours,
    totalMinutesWorked,
  }
}

function formatTimestampToKST(timestamp) {
  const date = new Date(timestamp)

  // 대한민국 표준시 (UTC+9)로 변환
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul',
    hour12: false, // 24시간 형식으로 출력
  }

  // 날짜 형식 맞추기
  const formattedDate = date.toLocaleString('ko-KR', options)

  // 년-월-일 시:분:초 포맷으로 리턴
  return formattedDate
}

function formatTimeString(timeString) {
  if (timeString === 'N/A') {
    return timeString
  } else {
    // ":"을 기준으로 분리
    const [hours, minutes] = timeString.split(':')

    // hours와 minutes가 숫자인지 확인
    const hoursValid = !isNaN(hours) && hours.trim() !== ''
    const minutesValid = !isNaN(minutes) && minutes.trim() !== ''

    // 유효하지 않으면 "N/A" 출력
    if (!hoursValid || !minutesValid) {
      return 'N/A'
    }

    // 결과 문자열 반환
    return `${hours}시간 ${minutes}분`
  }
}

function waitForSectionElement() {
  return new Promise((resolve) => {
    const timeout1 = setTimeout('', 330)
    const checkSection = () => {
      const sectionElement = document.querySelector('section[data-scope="page"][data-part="content"]',)
      if (sectionElement) {
        clearTimeout(timeout1) // 타임아웃 해제
        resolve(true) // 조건이 충족되면 완료
      } else {
        setTimeout(checkSection, 100) // 조건을 만족할 때까지 반복 확인
      }
    }
    checkSection()
  })
}

function getElementsWithClass(findTargetClassName) {
  const allDivs = document.querySelectorAll(findTargetClassName)

  const textArray = []

  allDivs.forEach((div) => {
    textArray.push(div.textContent.trim()) // 각 div의 텍스트를 배열에 추가
  })

  if (textArray.length === 0) {
    return 'N/A'
  } else {
    if (textArray[0] === '근무 시작') {
      return '0분'
    } else {
      return textArray[0]
    }
  }
}

function getLeaveDayArrayAtWeekcycle() {
  
  //const allDayDivs = Array.from(document.querySelectorAll(window.myCropPlugin.class_param_all_day_divs));
  const allDayDivs = Array.from(document.querySelectorAll('section.c-eqXmhd > div.c-PJLV > div.c-hzjAHE'));
  const vacationDays = [];
  
  //console.log('allDayDivs', allDayDivs);
  
  // 첫 번째는 제외
  const dayDivs = allDayDivs.filter(div => !div.classList.contains(window.myCropPlugin.class_param_day_divs_except_head_row));
  //console.log('dayDivs', dayDivs);
  
  dayDivs.forEach((dayDiv, index) => {
    
    const hasPurple = dayDiv.querySelector(window.myCropPlugin.class_param_vacation_button);
    if (hasPurple) {
      vacationDays.push(`${index + 1}휴가`);
    }
  });

  if (allDayDivs) {
    if (allDayDivs.length === 0) {
      return undefined
    } else {
      return vacationDays
    }
  } else {
    return undefined
  }
}

function getLeaveDayArrayAtWeekcycleNew() {
  
  const allDayDivs = Array.from(document.querySelectorAll(window.myCropPlugin.class_param_all_day_divs));
  const vacationDays = [];

  //console.log('allDayDivs', allDayDivs);
  
  // 첫 번째는 제외
  const dayDivs = allDayDivs.filter(div => !div.classList.contains(window.myCropPlugin.class_param_day_divs_except_head_row));
  //console.log('dayDivs', dayDivs);

  const resultsDays = []
  const resultsHolidays = []

  
  dayDivs.forEach((dayDiv, index) => {

    const childDiv = dayDiv.querySelector('div');

    const hasHolidayClass = childDiv.classList.contains(window.myCropPlugin.class_param_get_day_and_holiday_child);
    
    if (hasHolidayClass) {
      vacationDays.push(`${index}휴가`); // index + 1 이 날짜 (1일부터 시작)
      const text = childDiv.textContent.trim();  // ✅ 텍스트 추출
        
      //console.log('text', text);
      resultsHolidays.push(text)
      
    }

    resultsDays.push(childDiv.textContent.trim())
  });

  if (allDayDivs) {
    if (allDayDivs.length === 0) {
      return undefined
    } else {
      return {
        parantObj: resultsDays,
        childObj: resultsHolidays,
        //leaveDays: 
      }
    }
  } else {
    return undefined
  }
}

function getLeaveDayArrayAtMonthType(month) {
  const parent = document.querySelectorAll(window.myCropPlugin.class_param_get_leave_day_array_at_month_parent)

  const textArray = []

  const currentMonth = new Date().getMonth() + 1

  let day = 0

  //console.log('parent', parent)

  parent.forEach((div) => {

    const header = div.querySelector(window.myCropPlugin.class_param_get_leave_day_array_at_month_child_header);
    if (header && !header.className.includes(window.myCropPlugin.class_param_get_leave_day_array_at_month_child_include)) {
      const dayString = header.querySelector('.c-rgLcI')?.innerText.trim();
      //console.log('유효한 날짜:', dayString);

      day = parseInt(dayString)
  
      if (month === currentMonth && day > 0) {
        const buttonDiv = div.querySelector(window.myCropPlugin.class_param_get_leave_day_array_at_month_leave,)
  
        if (buttonDiv) {
          textArray.push(`${dayString}연월차`)
        }
      }
    } else {
      return;
    }
  })

  if (textArray.length > 0) {
    return textArray
  } else {
    return textArray
  }
}

function getSearchDurationInfo() {
  const allDivs = document.querySelectorAll(window.myCropPlugin.class_param_get_duration)

  const textArray = []

  allDivs.forEach((div) => {
    textArray.push(div.textContent.trim()) // 각 div의 텍스트를 배열에 추가
  })

  if (textArray.length === 0) {
    return ''
  } else {
    return textArray[0]
  }
}

function getElementsInnerTextWithClass(findTargetClassName) {
  const allDivs = document.querySelectorAll(findTargetClassName)

  const textArray = []

  allDivs.forEach((div) => {
    textArray.push(div.textContent.trim()) // 각 div의 텍스트를 배열에 추가
  })

  if (textArray.length === 0) {
    return ''
  } else {
    return textArray[0]
  }
}

function countElementsWithClass(findTargetClassName) {
  // 모든 div 태그를 가져옴
  const allDivs = document.querySelectorAll(window.myCropPlugin.class_param_count_element_button)

  const leaveDayInfo = []

  // 조건에 맞는 div 태그 필터링
  const purpleDivs = Array.from(allDivs).filter((div) => {
    return div.className.includes(findTargetClassName)
  })

  purpleDivs.forEach((component) => {
    // 각 부모 요소 내부에서 자식 클래스 요소를 찾음
    leaveDayInfo.push(component.textContent.trim())
  })

  // 필요한 경우 배열 반환
  return purpleDivs.length
}

function countUnusedLeaveDays(LeaveArray) {
  const today = new Date()
  const currentDay = today.getDate()

  // 사용되지 않은 휴가일 계산
  const unusedLeaveDays = LeaveArray.filter((leave) => {
    // "숫자휴가" 형식에서 숫자를 추출
    const leaveDay = parseInt(leave)
    // 오늘 날짜 이후의 휴가만 필터링
    return leaveDay > currentDay
  })

  return unusedLeaveDays.length // 사용되지 않은 휴가의 개수
}

// 특정 클래스 구조에서 데이터를 추출하는 함수
function getDayAndHolidayAtWeekcycle(parentClass, childClass) {
  // 부모 클래스에 해당하는 요소를 모두 찾음
  const parentElements = document.querySelectorAll(`.${parentClass}`)
  const resultsDays = []
  const resultsHolidays = []

  parentElements.forEach((parent) => {
    // 각 부모 요소 내부에서 자식 클래스 요소를 찾음
    //const subElements = parent.querySelectorAll(`.c-bElvsc`)

    // resultsDays.push(parent.textContent.trim())

    // const hasClass = parent.classList.contains(`${childClass}`);
    
    // if (hasClass) {
    //   resultsHolidays.push(hasClass.textContent.trim());
    // }

    // const holidayDiv = parent.querySelector('.c-dNTXeN > div.c-bElvsc-fmLUio-colorType-holiday');

    // if (holidayDiv) {
    //   resultsHolidays.push(holidayDiv.textContent.trim());
    // }

    const child = parent.querySelector(`.${childClass}`)
    if (child) {
      // 자식 요소의 텍스트를 저장
      resultsHolidays.push(child.textContent.trim())
    }
  })

  //console.log('resultsDays:', resultsDays)

  return {
    parantObj: resultsDays,
    childObj: resultsHolidays,
  }
}

function getDayAndHolidayAtMonthType(month) {
  const parent = document.querySelectorAll(window.myCropPlugin.class_param_get_leave_day_array_at_month_parent)

  const textArray = []

  const resultsDays = []
  const resultsHolidays = []

  const today = new Date()
  const currentMonth = today.getMonth() + 1 // 월은 0부터 시작하므로 1을 더함
  const currentYear = today.getFullYear()

  let day = 0

  parent.forEach((div) => {

    const header = div.querySelector(window.myCropPlugin.class_param_get_leave_day_array_at_month_child_header);
    if (header && !header.className.includes(window.myCropPlugin.class_param_get_leave_day_array_at_month_child_include)) {
      const dayString = header.querySelector('.c-grczgB')?.innerText.trim();
      //console.log('유효한 날짜:', dayString);

      day = parseInt(dayString)

      if (month === currentMonth && day > 0) {
        weekData = isWeekend(currentYear, month, day)
        resultsDays.push(`${day}${weekData.day}`)

        if (weekData.type === 'Weekday') {
          const findDiv = header.querySelector(window.myCropPlugin.class_param_get_day_and_holiday_at_month_weekday,)
          if (findDiv) {
            resultsHolidays.push(`${day}${weekData.day}`)
          }
        }
      }
    } else {
      return;
    }
  })

  return {
    parantObj: resultsDays,
    childObj: resultsHolidays,
  }
}

function isWeekend(year, month, day) {
  const days = ['일', '월', '화', '수', '목', '금', '토']

  // Date 객체 생성 (월은 0부터 시작하므로 -1 필요)
  const date = new Date(year, month - 1, day)

  // Date 객체의 getDay() 메서드로 요일 확인
  // 0: 일요일, 6: 토요일
  const dayOfWeek = date.getDay()

  const type = dayOfWeek === 0 || dayOfWeek === 6 ? 'Weekend' : 'Weekday'

  // 결과 반환
  return {
    type, // "Weekend" 또는 "Weekday"
    day: days[dayOfWeek], // "일", "월", ..., "토"
  }
}

// element 생성
function createElement(tag, options = {}) {
  const { content, attributes = {} } = options
  const element = document.createElement(tag)

  // 설정
  if (content) element.innerHTML = content
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })

  return element
}

function updateAppendUi(calculate_flex_worktime_mode, workpageViewType, data) {
  const display_enable = false

  if(display_enable)
  {
    console.log('근무 페이지 표기 방식:', workpageViewType)
  }

  if (data === undefined) {
    return
  }

  //const calculate_flex_work = (35 * data.childNodesArray.length / 7) - (7 * data.weekdayHolidays.length);
  const calculate_flex_work = calculateMonthWorkTimeStandard(data.totalWorkDoneTime, data.monthWorkLeftTime)

  const calculate_flex_target_time_per_day = calculate_flex_work / data.totalEffectiveWeekdays

  // 획득값 출력 예시)
  // 근무 상태: 근무중
  // 당월 신청한 연월차 수: 1
  // 당월 일일 총 개수: 31
  // 금일까지의 근로 가능일: 13 일
  // 금일 근로시간: 10시간 34분
  // 당월 총 근로시간: 100:49
  // 당월 총 근로 가능 일 갯수: 18
  // 당월 잔여 근무 일: 5
  // 당월 잔여 근무 시간: 877 분
  // 당월 잔여 근무 시간 / 일: 2.92 시간
  // 잔여 근로가능일:2 = (잔여 근로일: 3) - (명일~월말간 연월차 수:1)

  // text 생성
  var monthHours = data.totalEffectiveWeekdays * 7
  if(calculate_flex_worktime_mode) {
    monthHours = calculate_flex_work
  }

  const compareTime = data.totalWorkDoneTimeHour * 60 + data.totalWorkDoneTimeMin
  const timePercentage = (compareTime / (monthHours * 60)) * 100

  if(display_enable)
  {
    // 데이터 확인용
    console.log(`당월 총 일 배열: ${data.childNodesArray}`);
    console.log(`당월 총 일 배열 갯수: ${data.childNodesArray.length}`);
    console.log(`당월 주말 포함 공휴일 배열: ${data.childObj}`);
    console.log(`평일중 공휴일 배열: ${data.weekdayHolidays}`);
    console.log(`평일중 공휴일 배열 갯수: ${data.weekdayHolidays.length}`);
    console.log(`오늘까지의 평일 갯수: ${data.totalWeekdays}`);

    console.log(`flex 근무시간: ${calculate_flex_work}`);
    console.log(`flex 근무시간으로 하루당 근무 목표시간: ${calculate_flex_target_time_per_day}`);
  
    // 상시 획득 가능 값
    console.log(`근무 상태: ${data.workStatus}`)
    console.log(`금일 근로시간: ${data.todayWorkTime}`)
    console.log(`당월 신청한 연월차 수: ${data.leaveDays}`);
    console.log(`당월 일일 총 개수: ${data.findObj.parantObj.length}`);
    console.log(`금일까지의 근로 가능일: ${data.workdoneDayCount} 일`);
    console.log(`당월 총 근로시간: ${data.totalWorkDoneTime}`);
    console.log(`당월 총 근로 가능 일 갯수: ${data.totalEffectiveWeekdays}`);
    console.log(`당월 잔여 휴가 제외 근무 가능일: ${data.restEffectiveWeekdaysWithoutLeaveDay}`);
    console.log(`당월 잔여 근무 시간: ${data.restNeedTime} 분`);
    console.log(`당월 잔여 근무 시간 / 일: ${data.restNeedWorkTimePerDay} 시간`);
    console.log(`잔여 근로가능일:${data.restEffectiveWeekdaysWithoutLeaveDay} = (잔여 근로일: ${data.restEffectiveWeekdays}) - (명일~월말간 연월차 수:${data.numberUnuseLeaveDay})`);
  }

  const TEXT_TYPE = {
    WORKING_DAY: {
      type: 'working_day',
      class: 'custom-ui__item--working_day',
    },
    WORKING_TIME: {
      type: 'working_time',
      class: 'custom-ui__item--working_time',
    },
    WORKING_LEFTOVER: {
      type: 'working_leftover',
      class: 'custom-ui__item--working_leftover',
    },
    WORKING_HOLIDAY: {
      type: 'working_holiday',
      class: 'custom-ui__item--holiday',
    },
  }

  // 타입에 따른 텍스트 출력
  function createTextType(type) {
    let text
    switch (type) {
      case TEXT_TYPE.WORKING_DAY.type:
        text = {
          title: '근무일',
          tooltip:
            '휴가일을 포함하여 근무일이 계산됩니다.<br/>(현재 근무일 / 당월 의무 근무일)',
          today: `${data.workdoneDayCount}일`,
          total: `${data.totalEffectiveWeekdays}일`,
        }
        break
      case TEXT_TYPE.WORKING_TIME.type:
        text = {
          title: '근무시간',
          tooltip:
            '휴가일을 포함하여 근무시간이 계산됩니다.<br/>(현재 총 근무시간 / 당월 의무 근무시간 (달성률))',
          today: `${data.totalWorkDoneTimeHour}시간 ${data.totalWorkDoneTimeMin}분`,
          total: `${monthHours}시간`,
          percent: `(${timePercentage.toFixed(2)}%)`,
        }
        break
      case TEXT_TYPE.WORKING_LEFTOVER.type:
        text = {
          title: '잔여시간',
          tooltip:
            '휴가일을 포함하여 잔여 근무시간이 계산됩니다.<br/>잔여 근무시간 (잔여 일당 최소 근무시간)',
          today: `${Math.floor(data.restNeedTime / 60)}시간 ${
            data.restNeedTime % 60
          }분 (${data.restNeedWorkTimePerDayHour}시간 ${
            data.restNeedWorkTimePerDayMin
          }분)
          
          `,
        }
        break
      case TEXT_TYPE.WORKING_HOLIDAY.type:
        text = {
          title: '휴가사용',
          today: `${data.leaveDays}일`,
        }
        break
    }
    return text
  }

  // 타입에 따른 텍스트를 출력할 구조
  function createTextStructure(type) {
    const text = createTextType(type)

    return `
      <span class="custom-ui__title-wrap">
        <span class="custom-ui__title">${text.title}</span>
        ${
          text.tooltip
            ? `<span class="custom-ui__tooltip">${text.tooltip}</span>`
            : ''
        }
      </span>
      <span class="today">${text.today}</span>
      ${text.total ? `<span class="total">${text.total}</span>` : ''}
      ${text.percent ? `<span class="percent">${text.percent}</span>` : ''}
    `
  }

  // 텍스트 업데이트
  function updateCustomUiContent(className, type) {
    const element = document.querySelector(`.${className}`)
    if (element) {
      const todayElement = element.querySelector('.today')
      const totalElement = element.querySelector('.total')
      const percentElement = element.querySelector('.percent')
      const text = createTextType(type)

      if (todayElement) todayElement.textContent = text.today
      if (totalElement) totalElement.textContent = text.total
      if (percentElement) percentElement.textContent = text.percent
    }
  }

  //const section = document.querySelector('.fx_b722dd09_izclpo1 > *')
  const section = document.querySelector('main[data-scope="page"][data-part="main"] > *');

  const wrapper = document.querySelector('.custom-ui-wrap')
  const ui = document.querySelector('.custom-ui')
  const customUiItems = document.querySelectorAll('.custom-ui__item')
  const hasWorkingWeek = document.querySelector('.custom-ui__working_week')

  // element - wrapper
  const customUiWrap = createElement('div', {
    attributes: { class: 'custom-ui-wrap' },
  })
  const customUiItemWrap = createElement('div', {
    attributes: { class: 'custom-ui' },
  })
  // element - 근무일
  const workingDay = createElement('div', {
    attributes: {
      class: `custom-ui__item ${TEXT_TYPE.WORKING_DAY.class}`,
    },
    content: createTextStructure(TEXT_TYPE.WORKING_DAY.type),
  })
  // element - 근무시간
  const workingTime = createElement('div', {
    attributes: {
      class: `custom-ui__item ${TEXT_TYPE.WORKING_TIME.class}`,
    },
    content: createTextStructure(TEXT_TYPE.WORKING_TIME.type),
  })
  // element - 잔여시간
  const workingLeftoverTime = createElement('div', {
    attributes: {
      class: `custom-ui__item ${TEXT_TYPE.WORKING_LEFTOVER.class}`,
    },
    content: createTextStructure(TEXT_TYPE.WORKING_LEFTOVER.type),
  })
  // element - 휴가사용
  const workingHoliday = createElement('div', {
    attributes: {
      class: `custom-ui__item ${TEXT_TYPE.WORKING_HOLIDAY.class}`,
    },
    content: createTextStructure(TEXT_TYPE.WORKING_HOLIDAY.type),
  })
  // element - 주
  const viewTypeWeek = createElement('div', {
    attributes: {
      class: 'custom-ui__working_week',
    },
    content: '"주기"와 "월" 보기에서만 사용 가능합니다 🥺',
  })

  // 초기화 함수: wrapper가 없으면 추가
  function initializeWrapper() {
    if (!wrapper) {
      section.insertBefore(customUiWrap, section.firstChild)
      customUiWrap.appendChild(customUiItemWrap)
    }
  }

  // 요소 제거 함수
  function removeCustomUiItems() {
    customUiItems.forEach((item) => item.remove())
  }

  // 메인 로직 함수
  function handleWorkpageViewType() {
    initializeWrapper()

    // '주' 처리
    if (workpageViewType === '주') {
      // custom-ui__item 있으면 제거
      if (customUiItems.length > 0) {
        removeCustomUiItems()
      }
      // hasWorkingWeek 없으면 추가
      if (!hasWorkingWeek && wrapper) {
        ui.appendChild(viewTypeWeek)
      }
      return
    }

    // '주기', '월' 처리
    if (workpageViewType === '주기' || workpageViewType === '월') {
      // hasWorkingWeek 있으면 제거
      if (hasWorkingWeek) {
        hasWorkingWeek.remove()
      }

      if (customUiItems.length === 0) {
        // custom-ui__item 없으면 추가
        if (wrapper) {
          ui.appendChild(workingDay)
          ui.appendChild(workingTime)
          ui.appendChild(workingLeftoverTime)
          ui.appendChild(workingHoliday)
        }
      } else {
        // custom-ui__item 있으면 텍스트 업데이트
        updateCustomUiContent(
          TEXT_TYPE.WORKING_DAY.class,
          TEXT_TYPE.WORKING_DAY.type,
        )
        updateCustomUiContent(
          TEXT_TYPE.WORKING_TIME.class,
          TEXT_TYPE.WORKING_TIME.type,
        )
        updateCustomUiContent(
          TEXT_TYPE.WORKING_LEFTOVER.class,
          TEXT_TYPE.WORKING_LEFTOVER.type,
        )
        updateCustomUiContent(
          TEXT_TYPE.WORKING_HOLIDAY.class,
          TEXT_TYPE.WORKING_HOLIDAY.type,
        )
      }
    }
  }

  // 실행
  handleWorkpageViewType()
}

function calculateMonthWorkTimeStandard(totalWorkDoneTime, monthWorkLeftTime) {
    function toMinutes(timeStr) {
        const match = timeStr.match(/^([+-]?)(\d+):(\d+)$/);
        if (!match) throw new Error(`Invalid time format: ${timeStr}`);

        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);

        return sign * (hours * 60 + minutes);
    }

    const totalDone = toMinutes(totalWorkDoneTime);
    const monthLeft = toMinutes(monthWorkLeftTime);

    // 시간 단위 결과 (소수점 버림)
    return Math.trunc((totalDone - monthLeft) / 60);
}

function getMinutesIfNegative(monthWorkLeftTime) {
    const match = monthWorkLeftTime.match(/^([+-]?)(\d+):(\d+)$/);
    if (!match) throw new Error(`Invalid time format: ${monthWorkLeftTime}`);

    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const totalMinutes = hours * 60 + minutes;

    return sign === -1 ? totalMinutes : 0;
}