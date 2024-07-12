from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os

from sqlalchemy import Boolean, DateTime, Float, Integer, MetaData, desc, func, select
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped


class Base(DeclarativeBase):
    pass


class SensorData(Base):
    __tablename__ = "sensor_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    create_time: Mapped[datetime] = mapped_column(DateTime)
    temperature: Mapped[float] = mapped_column(Float)
    pressure: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    gas_concentration: Mapped[float] = mapped_column(Float)
    lux: Mapped[float] = mapped_column(Float)
    x_acceleration: Mapped[float] = mapped_column(Float)
    y_acceleration: Mapped[float] = mapped_column(Float)
    z_acceleration: Mapped[float] = mapped_column(Float)
    x_rotation: Mapped[float] = mapped_column(Float)
    y_rotation: Mapped[float] = mapped_column(Float)
    z_rotation: Mapped[float] = mapped_column(Float)
    environment_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=True, default=0)
    light_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=True, default=0)
    vibration_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=True, default=0)
    

async_engine = create_async_engine(
    url=f"mysql+asyncmy://{os.environ['MYSQL_USER']}:{os.environ['MYSQL_PASSWORD']}@db/{os.environ.get('MYSQL_DATABASE')}",
)

session_maker = async_sessionmaker(bind=async_engine)


async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    

async def insert_sensor_data(data: dict[str:any]) -> bool:
    try:
        async with session_maker() as session:
            async with session.begin():
                sensor_data = SensorData(**data)
                session.add(sensor_data)
                await session.commit()
        return True
    except SQLAlchemyError as e:
        print(f"Error occurred during database operation: {e}")
        await session.rollback()
        return False

async def get_latest_sensor_data(n: int):
    try:
        async with session_maker() as session:
            async with session.begin():
                stmt = select(SensorData).order_by(desc(SensorData.create_time)).limit(n)
                result = await session.execute(stmt)
                sensor_data_list = result.scalars().all()
                sensor_data_dicts = [
                    {
                        'id': s.id,
                        'create_time': s.create_time,
                        'temperature': s.temperature,
                        'pressure': s.pressure,
                        'humidity': s.humidity,
                        'gas_concentration': s.gas_concentration,
                        'lux': s.lux,
                        'x_acceleration': s.x_acceleration,
                        'y_acceleration': s.y_acceleration,
                        'z_acceleration': s.z_acceleration,
                        'x_rotation': s.x_rotation,
                        'y_rotation': s.y_rotation,
                        'z_rotation': s.z_rotation,
                        'environment_anomaly': s.environment_anomaly,
                        'light_anomaly': s.light_anomaly,
                        'vibration_anomaly': s.vibration_anomaly
                    }
                    for s in sensor_data_list
                ]

                return sensor_data_dicts
    except SQLAlchemyError as e:
        print(f"Error occurred during database operation: {e}")
        return []