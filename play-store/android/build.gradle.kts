plugins {
    id("com.android.application") version "8.7.2" apply false
    // play-services-ads 25.x 는 Kotlin 2.3 메타데이터로 배포돼서 컴파일러도 2.3 이상이어야 한다.
    id("org.jetbrains.kotlin.android") version "2.3.21" apply false
}
