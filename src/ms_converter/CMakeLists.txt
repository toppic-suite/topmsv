#Specify the version being used as well as the language
cmake_minimum_required(VERSION 3.1)
#Nmae your project here
PROJECT(mzMLReader)

SET(CMAKE_VERBOSE_MAKEFILE ON)

SET(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/../bin)

SET(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/../lib)

IF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")
SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -std=c++11 -O3 -DWITHOUT_MZ5 -fPIC")
#SET(CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Wall -std=c++11 -O2 -pg -fPIC")
ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Linux") 

IF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
#SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -std=c++11 -O3 -DWITHOUT_MZ5 -fPIC -fpermissive")
SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wno-unknown-pragmas -std=c++14 -O3 -DWITHOUT_MZ5 -fPIC -fpermissive")

ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")

message(STATUS "system name " ${CMAKE_SYSTEM_NAME})

IF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")
  # Linux specific code
  include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)
ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")

IF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
  # Windows specific code
  SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DWIN32")
  include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)
ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")

message(STATUS "cmake cxx flags " ${CMAKE_CXX_FLAGS})
# sqlite3
file(GLOB SQLITE3 ${CMAKE_CURRENT_SOURCE_DIR}/src/sqlite/sqlite3.c)
# pwiz
file(GLOB PWIZ_SRC ${CMAKE_CURRENT_SOURCE_DIR}/src/pwiz/utility/minimxml/*.cpp
                   ${CMAKE_CURRENT_SOURCE_DIR}/src/pwiz/utility/misc/*.cpp
                   ${CMAKE_CURRENT_SOURCE_DIR}/src/pwiz/data/common/*.cpp
                   ${CMAKE_CURRENT_SOURCE_DIR}/src/pwiz/data/msdata/*.cpp)
# nowide
file(GLOB NOWIDE_SRCS ${CMAKE_CURRENT_SOURCE_DIR}/src/boost/nowide/*.cpp)

# mzMLReader
file(GLOB MZMLREADER_MAIN_SRCS ${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp)

# msReader
file(GLOB MSREADER_SRC ${CMAKE_CURRENT_SOURCE_DIR}/src/msReader.cpp
                       ${CMAKE_CURRENT_SOURCE_DIR}/src/mzMLReader.cpp)

add_executable(mzMLReader ${MZMLREADER_MAIN_SRCS} ${MSREADER_SRC} ${PWIZ_SRC} ${SQLITE3} ${NOWIDE_SRCS})

IF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")
  target_link_libraries(mzMLReader dl boost_filesystem boost_chrono boost_thread boost_iostreams pthread z)

ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Linux") 

IF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
  target_link_libraries(mzMLReader boost_filesystem-mt boost_chrono-mt boost_iostreams-mt boost_thread-mt pthread z psapi)
ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Windows") 
