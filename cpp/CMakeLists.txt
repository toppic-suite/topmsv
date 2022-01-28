#Specify the version being used as well as the language
cmake_minimum_required(VERSION 3.1)
#Nmae your project here
PROJECT(mzMLReader)

SET(CMAKE_VERBOSE_MAKEFILE ON)

SET(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/../bin)

SET(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/../lib)

SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -std=c++11 -O3 -DWITHOUT_MZ5 -fPIC")
#SET(CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Wall -std=c++11 -O2 -pg -fPIC")
message(STATUS "system name " ${CMAKE_SYSTEM_NAME})

IF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")
  # Linux specific code
  SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wl,-rpath,./mzMLReader_resources/lib")
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

# mzMLReader
file(GLOB MZMLREADER_MAIN_SRCS ${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp)

# msReader
file(GLOB MSREADER_SRC ${CMAKE_CURRENT_SOURCE_DIR}/src/msReader.cpp
                       ${CMAKE_CURRENT_SOURCE_DIR}/src/mzMLReader.cpp)

add_executable(mzMLReader ${MZMLREADER_MAIN_SRCS} ${MSREADER_SRC} ${PWIZ_SRC} ${SQLITE3})

IF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")
  target_link_libraries(mzMLReader dl boost_program_options
        boost_filesystem boost_system boost_thread boost_iostreams boost_chrono pthread z)

ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Linux") 

IF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
  target_link_libraries(mzMLReader boost_program_options-mt
        boost_filesystem-mt boost_system-mt boost_thread-mt boost_iostreams-mt boost_chrono-mt pthread z)
ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Windows") 
