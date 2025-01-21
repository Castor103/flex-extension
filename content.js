(() => {
  const header = document.querySelector('.c-upfCI')
  if (header === undefined) {
    return
  } else {
    fetchDataFunction()
  }

  function fetchDataFunction() {
    waitForSectionElement().then(() => {

      //console.log(`rawData: ${document.documentElement.outerHTML}`);

      // 진입 확인용 총 근무 시간
      const totalWorkDoneTime = getElementsWithClass('span.c-hotmRC')
      
      if (totalWorkDoneTime === 'N/A') {
        //
        return
      } else {

        // workpageViewType : 주기, 월, 주
        const workpageViewType = getElementsInnerTextWithClass('.c-bHdqUR > *')

        // 크롤데이터
        let data = undefined

        if (workpageViewType === '월' || workpageViewType === '주기') {
          data = getData(workpageViewType)
        } else {
          // (workpageViewType === '주') 조건 혹은 기타 설정인 경우 이곳.
          console.log('표기 불가 페이지, 근무 페이지 설정을 주기 혹은 주로 변경 하도록 가이드')
        }

        // 플러그인에의한 UI업데이트 부부
        updateAppendUi(workpageViewType, data)
      }
    })
  }
})()

function getData(workpageViewType) {

  const updateTime = new Date().toISOString()

  const totalWorkDoneTime = getElementsWithClass('span.c-hotmRC')

  // 현재 근무 상태 = 근무중, 휴게중, ...
  const workStatus = getElementsWithClass('div.c-gzEFDl > *')

  let leaveDays = 0
  let numberUnuseLeaveDay = 0

  if (workpageViewType === '월') {
    const leaveDayArray = getLeaveDayArrayAtMonthType()
    //console.log('leaveDayArray월:', leaveDayArray) 
    leaveDays = leaveDayArray.length
    numberUnuseLeaveDay = countUnusedLeaveDays(leaveDayArray)

  } else if (workpageViewType === '주기') {
    const leaveDayArray = getLeaveDayArray(); 
    //console.log('leaveDayArray주기:', leaveDayArray) 
    leaveDays = leaveDayArray.length
    numberUnuseLeaveDay = countUnusedLeaveDays(leaveDayArray)
  }

  //console.log('leaveDays:', leaveDays)
  //console.log('numberUnuseLeaveDay:', numberUnuseLeaveDay) 

  const workSearchDurationInfo = getSearchDurationInfo()
  //console.log('workSearchDurationInfo:', workSearchDurationInfo) 

  const isSearchinfoMatch = isCurrentYearAndMonthInRange(workSearchDurationInfo)
  //console.log('isSearchinfoMatch:', isSearchinfoMatch) 
  
  // 금일 근로 시간 = 8시간 57분
  let todayWorkTime = getElementsWithClass('div.c-klJrXp')

  if(workStatus === "N/A") {
    todayWorkTime = "0분"
  }

  let totalWeekdays = 0
  let workdoneDayCount = 0
  let totalEffectiveWeekdays = 0
  let childNodesArray = []
  let weekdayHolidays = []
  let findObj = []

  if (workpageViewType === '월') {
    findObj = getDayAndHolidayAtMonthType()
    childNodesArray = findObj.parantObj
    //console.log(`childNodesArray: [${childNodesArray}]`)

    // 평일에 해당하는 공휴일 계산
    weekdayHolidays = findObj.childObj.filter((day) => {
      // 요일 데이터
      const dayOfWeek = day.slice(-1) // 마지막 문자 추출 (예: "수", "토")
      // 평일 요일만 포함 ("월", "화", "수", "목", "금")
      return ['월', '화', '수', '목', '금'].includes(dayOfWeek)
    })
  
    const result =
      calculateMonthlyWeekdaysAndEffectiveDays(weekdayHolidays)
  
    totalWeekdays = result.totalWeekdays
    workdoneDayCount = result.effectiveWeekdays
    totalEffectiveWeekdays = result.totalEffectiveWeekdays

  } else if (workpageViewType === '주기') {
    // 토, 일, 공휴일 검색용 클래스 필터값
    findObj = getDayAndHoliday('c-hPMBFa', 'c-icjrvK-fmLUio-isHoliday-true')
    childNodesArray = findObj.parantObj
    //console.log(`childNodesArray: [${childNodesArray}]`)
  
    // 평일에 해당하는 공휴일 계산
    weekdayHolidays = findObj.childObj.filter((day) => {
      // 요일 데이터
      const dayOfWeek = day.slice(-1) // 마지막 문자 추출 (예: "수", "토")
      // 평일 요일만 포함 ("월", "화", "수", "목", "금")
      return ['월', '화', '수', '목', '금'].includes(dayOfWeek)
    })
  
    const result =
      calculateMonthlyWeekdaysAndEffectiveDays(weekdayHolidays)
  
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

  const totalWorkDoneTimeFormatting = totalWorkDoneTime.split(':')
  const totalWorkDoneTimeHour = Math.floor(Number(totalMinutesWorked / 60))
  const totalWorkDoneTimeMin = Number(totalMinutesWorked % 60)

  const restEffectiveWeekdays =
    totalEffectiveWeekdays - workdoneDayCount - numberUnuseLeaveDay

  let restNeedTime =
    totalEffectiveWeekdays * 7 * 60 - totalMinutesWorked

  if (restNeedTime <= 0) {
    restNeedTime = 0
  }

  const restNeedWorkTimePerDay = (
    restNeedTime /
    restEffectiveWeekdays /
    60
  ).toFixed(2)

  const restNeedWorkTimePerDayFormatting =
    restNeedWorkTimePerDay.split('.')
    
  const restNeedWorkTimePerDayHour = Math.floor(
    restNeedWorkTimePerDay,
  )
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
    totalEffectiveWeekdays: totalEffectiveWeekdays,
    restEffectiveWeekdays: restEffectiveWeekdays,
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
  const rangeParts = dateRange.split(" – ");
  const startDateParts = rangeParts[0].trim().split(". ");
  const endDateParts = rangeParts[1].trim().split(". ");

  const startYear = parseInt(startDateParts[0]);
  const startMonth = parseInt(startDateParts[1]);
  const startDay = parseInt(startDateParts[2]);

  const endMonth = parseInt(endDateParts[0]);
  const endDay = parseInt(endDateParts[1]);

  // 현재 날짜
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth()는 0부터 시작하므로 1을 더함

  // 현재 연도와 월이 시작 연도와 월, 끝 연도와 월 사이에 있는지 확인
  if ((currentYear === startYear) && (currentMonth === startMonth)) {
      return true; // 현재 연도와 월이 범위 내에 있음
  } else {
      return false; // 현재 연도와 월이 범위 밖에 있음
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

function calculateAverageDailyWorkTime(
  dailyWorkTime,
  totalWorkDoneTime,
  weekdaysUntilToday,
) {
  if (dailyWorkTime === 'N/A') {
    dailyWorkTime = '0시간 0분'
  }

  if (totalWorkDoneTime === 'N/A') {
    totalWorkDoneTime = '0:00'
  }

  if (weekdaysUntilToday === 0) {
    return 0
  } else {
    // 오늘 근무 시간 (시간, 분으로 변환)
    const dailyWorkParts = dailyWorkTime
      .split('시간')
      .map((item) => item.trim())
      .filter(Boolean)
    const dailyHours = parseInt(dailyWorkParts[0])
    const dailyMinutes = dailyWorkParts[1]
      ? parseInt(dailyWorkParts[1].replace('분', '').trim())
      : 0
    const dailyWorkMinutes = dailyHours * 60 + dailyMinutes

    // 당월 근무 총시간 (시:분 형식)
    const totalWorkParts = totalWorkDoneTime.split(':')
    const totalWorkHours = parseInt(totalWorkParts[0])
    const totalWorkMinutes = parseInt(totalWorkParts[1])
    const totalWorkMinutesTotal = totalWorkHours * 60 + totalWorkMinutes

    // 오늘까지의 총 근무 시간 (오늘 근무 시간 + 당월 근무 시간)
    const totalMinutesWorked = dailyWorkMinutes + totalWorkMinutesTotal

    // 일당 평균 근로시간 계산 (총 근무 시간 ÷ 평일 수)
    const averageDailyWorkMinutes = totalMinutesWorked / weekdaysUntilToday

    // 평균 근로시간을 시간 단위로 변환 (소수점 2자리까지)
    const averageDailyWorkHours = (averageDailyWorkMinutes / 60).toFixed(2)

    return {
      averageDailyWorkHours,
      totalMinutesWorked,
    }
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
    const timeout1 = setTimeout("", 330)
    const checkSection = () => {
      const sectionElement = document.querySelector(
        'section[data-scope="page"][data-part="content"]',
      )
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

function getLeaveDayArray() {
  const parent = document.querySelectorAll('.c-hzjAHE')

  const textArray = []
  let dayIndex = 0;

  parent.forEach((div) => {
    const buttonDiv = div.querySelector('div[type="button"].c-ePuMfZ-lgczji-color-purple');
    if (buttonDiv) {
      textArray.push(`${dayIndex}휴가`) 
    }
    dayIndex = dayIndex + 1;
  })
  
  if (parent) {
    if (parent.length === 0) {
      
      return undefined
    } else {
      
      return textArray
    }
  } else {
    return undefined
  }
}

function getLeaveDayArrayAtMonthType() {
  const parent = document.querySelectorAll('section.c-iYqeMd')

  const textArray = []

  const currentMonth = (new Date().getMonth()) + 1
  
  let day = 0
  let month = 0

  parent.forEach((div) => {
    const childDayInfo = div.querySelector('header.c-cMmCSn > div.c-gyZloO')
    const dayString = childDayInfo.textContent.trim()

    if(dayString.includes('.')) {
      month = parseInt(dayString.split('.')[0]);
      day = parseInt(dayString.split('.')[1]);
    } else {
      day = parseInt(dayString);
    }

    if(month === currentMonth && day > 0) {
      const buttonDiv = div.querySelector(
        '.c-gwijCh > .c-dYCejv > div[type="button"].c-dmgoKw-lgczji-color-purple'
      );
      
      if (buttonDiv) {
        //textArray.push(`${childDayInfo?.textContent.trim()} ${buttonDiv?.textContent.trim()}`) 
        textArray.push(`${childDayInfo?.textContent.trim()}연월차`) 
      }
    }
  })
  
  if (textArray.length > 0) {
    return textArray
  } else {
    return undefined
  }
}

function getSearchDurationInfo() {
  const allDivs = document.querySelectorAll('button.c-bIRrzL-ifzdrhW-css')

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
  const allDivs = document.querySelectorAll('div[type="button"]')

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
  const today = new Date();
  const currentDay = today.getDate();

  // 사용되지 않은 휴가일 계산
  const unusedLeaveDays = LeaveArray.filter(leave => {
      // "숫자휴가" 형식에서 숫자를 추출
      const leaveDay = parseInt(leave);
      // 오늘 날짜 이후의 휴가만 필터링
      return leaveDay > currentDay;
  });

  return unusedLeaveDays.length; // 사용되지 않은 휴가의 개수
}

// 특정 클래스 구조에서 데이터를 추출하는 함수
function getDayAndHoliday(parentClass, childClass) {
  // 부모 클래스에 해당하는 요소를 모두 찾음
  const parentElements = document.querySelectorAll(`.${parentClass}`)
  const resultsDays = []
  const resultsHolidays = []

  parentElements.forEach((parent) => {
    // 각 부모 요소 내부에서 자식 클래스 요소를 찾음
    resultsDays.push(parent.textContent.trim())

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


function getDayAndHolidayAtMonthType() {
  const parent = document.querySelectorAll('section.c-iYqeMd')

  const textArray = []

  const resultsDays = []
  const resultsHolidays = []

  const today = new Date()
  const currentMonth = today.getMonth() + 1 // 월은 0부터 시작하므로 1을 더함
  const currentYear = today.getFullYear()
  
  let day = 0
  let month = 0

  parent.forEach((div) => {
    const childDayInfo = div.querySelector('header.c-cMmCSn > div.c-gyZloO')

    const dayString = childDayInfo.textContent.trim()
    
    if(dayString.includes('.')) {
      month = parseInt(dayString.split('.')[0]);
      day = parseInt(dayString.split('.')[1]);
    } else {
      day = parseInt(dayString);
    }
    
    if(month === currentMonth && day > 0) {
      weekData = isWeekend(currentYear, month, day)
      resultsDays.push(`${day}${weekData.day}`) 

      if(weekData.type === "Weekday") {
        const findDiv = childDayInfo.querySelector('.c-ezanJe-fmLUio-isHoliday-true');
        if (findDiv) {
          resultsHolidays.push(`${day}${weekData.day}`)
          
        } 
      }
    }
  })
  
  return {
    parantObj: resultsDays, 
    childObj: resultsHolidays
  }
}

function isWeekend(year, month, day) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  // Date 객체 생성 (월은 0부터 시작하므로 -1 필요)
  const date = new Date(year, month - 1, day);

  // Date 객체의 getDay() 메서드로 요일 확인
  // 0: 일요일, 6: 토요일
  const dayOfWeek = date.getDay();

  const type = dayOfWeek === 0 || dayOfWeek === 6 ? "Weekend" : "Weekday";

  // 결과 반환
  return {
    type, // "Weekend" 또는 "Weekday"
    day: days[dayOfWeek], // "일", "월", ..., "토"
  };
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

function updateAppendUi(workpageViewType, data) {

  //console.log('근무 페이지 표기 방식:', workpageViewType)

  if(data === undefined) {
    return
  } 

  // 데이터 확인용
  //console.log(`당월 총 일 배열: ${data.childNodesArray}`);
  //console.log(`당월 주말 포함 공휴일 배열: ${data.childObj}`);
  //console.log(`평일중 공휴일 배열: ${data.weekdayHolidays}`);
  //console.log(`오늘까지의 평일 갯수: ${data.totalWeekdays}`);

  // 상시 획득 가능 값
  //console.log(`근무 상태: ${data.workStatus}`)
  //console.log(`금일 근로시간: ${data.todayWorkTime}`)
  //console.log(`당월 신청한 연월차 수: ${data.leaveDays}`);
  //console.log(`당월 일일 총 개수: ${data.findObj.parantObj.length}`);
  //console.log(`금일까지의 근로 가능일: ${data.workdoneDayCount} 일`);
  //console.log(`당월 총 근로시간: ${data.totalWorkDoneTime}`);
  //console.log(`당월 총 근로 가능 일 갯수: ${data.totalEffectiveWeekdays}`);
  //console.log(`당월 잔여 휴가 제외 근무 가능일: ${data.restEffectiveWeekdays}`);
  //console.log(`당월 잔여 근무 시간: ${data.restNeedTime} 분`);
  //console.log(`당월 잔여 근무 시간 / 일: ${data.restNeedWorkTimePerDay} 시간`);

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
  
  // text 생성
  const monthHours = data.totalEffectiveWeekdays * 7
  const compareTime =
    data.totalWorkDoneTimeHour * 60 + data.totalWorkDoneTimeMin
  const timePercentage = (compareTime / (monthHours * 60)) * 100
  function createText(type) {
    let text
    switch (type) {
      case 'working_day':
        text = `
          <span class="custom-ui__title-wrap">
            <span class="custom-ui__title">근무일</span>
            <span class="custom-ui__tooltip">휴가일을 포함하여 근무일이 계산됩니다.<br/>(현재 근무일 / 당월 의무 근무일)</span>
          </span>
          <span class="today">${data.workdoneDayCount}일</span>
          <span class="total">${data.totalEffectiveWeekdays}일</span>
        `
        break
      case 'working_time':
        text = `
          <span class="custom-ui__title-wrap">
            <span class="custom-ui__title">근무시간</span>
            <span class="custom-ui__tooltip">휴가일을 포함하여 근무시간이 계산됩니다.<br/>(현재 총 근무시간 / 당월 의무 근무시간 (달성률))</span>
          </span>
          <span class="today">${data.totalWorkDoneTimeHour}시간 ${data.totalWorkDoneTimeMin}분</span>
          <span class="total">${monthHours}시간</span>
          <span class="percent">(${timePercentage.toFixed(2)}%)</span>
        `
        break
      case 'working_leftover':
        text = `
          <span class="custom-ui__title-wrap">
            <span class="custom-ui__title">잔여시간</span>
            <span class="custom-ui__tooltip">휴가일을 포함하여 잔여 근무시간이 계산됩니다.<br/>잔여 근무시간 (잔여 일당 최소 근무시간)</span>
          </span>
           <span class="today">${Math.floor(data.restNeedTime / 60)}시간 ${
            data.restNeedTime % 60
        }분 (${data.restNeedWorkTimePerDayHour}시간 ${data.restNeedWorkTimePerDayMin}분)</span>
        `
        break
      case 'working_holiday':
        text = `
          <span class="custom-ui__title-wrap">
            <span class="custom-ui__title">휴가사용</span>
          </span>
          <span class="today">${data.leaveDays}일
        `
        break
    }
    return text
  }
  
  // 표출 부.
  const section = document.querySelector('.c-dHHzzw > *')
  const wrapper = document.querySelector('.custom-ui-wrap')
  const customUiWrap = createElement('div', {
    attributes: { class: 'custom-ui-wrap' },
  })
  const customUiItemWrap = createElement('div', {
    attributes: { class: 'custom-ui' },
  })
  
  // 표출 부 - 근무일
  const workingDay = createElement('div', {
    attributes: {
      class: 'custom-ui__item custom-ui__item--working_day',
    },
    content: createText('working_day'),
  })
  // 표출 부 - 근무시간
  const workingTime = createElement('div', {
    attributes: {
      class: 'custom-ui__item custom-ui__item--working_time',
    },
    content: createText('working_time'),
  })
  // 표출 부 - 잔여 근무시간
  const workingLeftoverTime = createElement('div', {
    attributes: {
      class: 'custom-ui__item custom-ui__item--working_leftover',
    },
    content: createText('working_leftover'),
  })
  // 표출 부 - 휴가사용
  const workingHoliday = createElement('div', {
    attributes: {
      class: 'custom-ui__item custom-ui__item--holiday',
    },
    content: createText('working_holiday'),
  })
  if (wrapper) {
    document.querySelector(
      '.custom-ui__item--working_day',
    ).innerHTML = createText('working_day')
    document.querySelector(
      '.custom-ui__item--working_time',
    ).innerHTML = createText('working_time')
    document.querySelector(
      '.custom-ui__item--working_leftover',
    ).innerHTML = createText('working_leftover')
    document.querySelector('.custom-ui__item--holiday').innerHTML =
      createText('working_holiday')
  } else {
    section.insertBefore(customUiWrap, section.firstChild)
    customUiWrap.appendChild(customUiItemWrap)
    customUiItemWrap.appendChild(workingDay)
    customUiItemWrap.appendChild(workingTime)
    customUiItemWrap.appendChild(workingLeftoverTime)
    customUiItemWrap.appendChild(workingHoliday)
  }
}
